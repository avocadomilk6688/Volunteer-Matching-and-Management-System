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
      relations: ['volunteer', 'organization', 'admin'],
    });
  }

  async findOne(id: string) {
    return await this.userRepo.findOne({
      where: { id },
      relations: ['volunteer', 'organization', 'admin'],
    });
  }

  async update(id: string, updateDto: any) {
    await this.userRepo.update(id, updateDto);
    return this.findOne(id);
  }

  async remove(id: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }

    // 1. Clear profile child tables safely using TypeORM relationship matching syntax
    // instead of flat 'userId' strings to fix the EntityPropertyNotFoundError
    if (user.role === 'volunteer') {
      await this.volunteerRepo.delete(id);
    } else if (user.role === 'admin') {
      await this.adminRepo.delete(id);
    } else if (user.role === 'organization') {
      // --- FIXED: Uses TypeORM object relation notation syntax matching target user ids ---
      await this.organizationRepo.delete({ user: { id } });
    }

    // 2. Finally, remove the master User registry record row line item
    const result = await this.userRepo.delete(id);

    return { deleted: (result.affected ?? 0) > 0 };
  }
}
