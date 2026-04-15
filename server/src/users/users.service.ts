import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { User } from './entities/user.entity';
import { Volunteer } from '../volunteers/entities/volunteer.entity';
import { Admin } from './entities/admin.entity';
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
      id: sharedId,
      user: savedUser,
    });

    await this.volunteerRepo.save(newVolunteer);

    return {
      id: sharedId,
      message:
        'Volunteer account and profile created successfully with shared ID',
    };
  }

  async findAll() {
    return await this.userRepo.find({
      relations: ['volunteer', 'admin'],
    });
  }

  async findOne(id: string) {
    return await this.userRepo.findOne({
      where: { id: id as unknown as string } as FindOptionsWhere<User>,
      relations: ['volunteer', 'admin'],
    });
  }

  async remove(id: string) {
    const result = await this.userRepo.delete(id);
    return { deleted: (result.affected ?? 0) > 0 };
  }
}
