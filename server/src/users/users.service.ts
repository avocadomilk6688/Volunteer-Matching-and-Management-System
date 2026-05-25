import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Volunteer } from '../volunteers/entities/volunteer.entity';
import { Admin } from './entities/admin.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { generateCustomId } from '../common/utils/id_generator.util';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Volunteer)
    private readonly volunteerRepo: Repository<Volunteer>,

    @InjectRepository(Admin)
    private readonly adminRepo: Repository<Admin>,

    @InjectRepository(Organization)
    private readonly organizationRepo: Repository<Organization>,
  ) {}

  async createVolunteer(dto: CreateUserDto) {
    const isOrg = dto.role === 'organization';

    if (isOrg) {
      // --- ORGANIZATION CREATION ARCHITECTURE ---
      const orgId = await generateCustomId(this.organizationRepo as any, 'ORG');
      const userId = await generateCustomId(this.userRepo as any, 'U');

      // 1. Commit identifiers to master core User table
      const newUser = this.userRepo.create({
        id: userId,
        username: dto.username,
        email: dto.email,
        password: dto.password,
        role: 'organization',
      });
      const savedUser = await this.userRepo.save(newUser);

      // 2. Commit profile parameters directly to the organization entity layout
      // --- FIXED: Removed the invalid 'userId' property to satisfy DeepPartial constraints ---
      const newOrg = this.organizationRepo.create({
        id: orgId,
        user: savedUser, // TypeORM handles mapping this down to your 'userId' column behind the scenes!
        contact_number: dto.contact_number || '',
        rating: 0.0,
        description: '',
        profile_picture_url: '/uploads/avatars/default-org.png',
      });
      await this.organizationRepo.save(newOrg);

      return {
        id: orgId,
        message: 'Organization account and profile created successfully',
      };
    } else {
      // --- VOLUNTEER CREATION ARCHITECTURE (SHARED PRIMARY KEY) ---
      const sharedId = await generateCustomId(this.volunteerRepo as any, 'V');

      // 1. Commit identifiers to master core User table
      const newUser = this.userRepo.create({
        id: sharedId,
        username: dto.username,
        email: dto.email,
        password: dto.password,
        role: 'volunteer',
      });
      const savedUser = await this.userRepo.save(newUser);

      // 2. Commit profile parameters directly to the volunteer entity layout
      const newVolunteer = this.volunteerRepo.create({
        id: sharedId, // Share the exact same ID value string as the parent user record
        user: savedUser,
        contact_number: dto.contact_number || '',
        gender: '',
        location: '',
        rating: 0.0,
        points: 0,
        profile_picture_url: '',
      });
      await this.volunteerRepo.save(newVolunteer);

      return {
        id: sharedId,
        message: 'Volunteer account and profile created successfully',
      };
    }
  }

  async findAll() {
    return await this.userRepo.find({
      relations: ['volunteer', 'organization', 'admin'],
    });
  }

  async findOne(id: string) {
    return await this.userRepo.findOne({
      where: { id },
      relations: ['volunteer', 'organization', 'admin'],
    });
  }

  async update(id: string, updateDto: Record<string, unknown>) {
    await this.userRepo.update(id, updateDto);
    return this.findOne(id);
  }

  async remove(id: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }

    // Clear profile child tables safely using TypeORM relationship matching syntax
    if (user.role === 'volunteer') {
      await this.volunteerRepo.delete(id);
    } else if (user.role === 'admin') {
      await this.adminRepo.delete(id);
    } else if (user.role === 'organization') {
      await this.organizationRepo.delete({ user: { id } });
    }

    // Finally, remove the master User registry record row line item
    const result = await this.userRepo.delete(id);

    return { deleted: (result.affected ?? 0) > 0 };
  }
}
