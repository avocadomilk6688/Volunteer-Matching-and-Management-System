import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Volunteer } from '../volunteers/entities/volunteer.entity';
import { Admin } from './entities/admin.entity';
import { Organization } from '../organizations/entities/organization.entity'; // Ensure this path is correct
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

    // ADDED: Inject the Organization repository
    @InjectRepository(Organization)
    private readonly organizationRepo: Repository<Organization>,
  ) {}

  async createVolunteer(dto: CreateUserDto) {
    const sharedId = await generateCustomId(this.volunteerRepo, 'V');

    const newUser = this.userRepo.create({
      id: sharedId,
      username: dto.username,
      email: dto.email,
      password: dto.password,
      role: 'volunteer',
    });
    const savedUser = await this.userRepo.save(newUser);

    const newVolunteer = this.volunteerRepo.create({
      user: savedUser,
    });

    await this.volunteerRepo.save(newVolunteer);

    return {
      id: sharedId,
      message: 'Volunteer account and profile created successfully',
    };
  }

  async findAll() {
    return await this.userRepo.find({
      // Fetching all relations so the frontend sees the profile_picture_url
      relations: ['volunteer', 'organization', 'admin'],
    });
  }

  async findOne(id: string) {
    return await this.userRepo.findOne({
      where: { id },
      // Fetching all relations so the frontend sees the profile_picture_url
      relations: ['volunteer', 'organization', 'admin'],
    });
  }

  async update(id: string, updateDto: any) {
    await this.userRepo.update(id, updateDto);
    return this.findOne(id);
  }

  async remove(id: string) {
    // 1. Delete associated profile records first (Referential Integrity)
    await this.volunteerRepo.delete(id);
    await this.adminRepo.delete(id);

    // Based on your DB structure, Organization uses 'userId' as the link
    await this.organizationRepo.delete({ userId: id } as any);

    // 2. Finally, delete the main User record
    const result = await this.userRepo.delete(id);

    return { deleted: (result.affected ?? 0) > 0 };
  }
}
