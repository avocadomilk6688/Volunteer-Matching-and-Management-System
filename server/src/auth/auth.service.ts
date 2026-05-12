import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async register(createUserDto: CreateUserDto): Promise<User> {
    const { email, password, role } = createUserDto;
    const prefix = role === 'volunteer' ? 'V' : 'O';

    const lastUser = await this.userRepository
      .createQueryBuilder('user')
      .where('user.id LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('user.id', 'DESC')
      .getOne();

    const lastIdNumber = lastUser ? parseInt(lastUser.id.substring(1)) : 0;
    const newId = `${prefix}${String(lastIdNumber + 1).padStart(3, '0')}`;

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = this.userRepository.create({
      id: newId,
      email,
      password: hashedPassword,
      role,
    });

    try {
      return await this.userRepository.save(user);
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'ER_DUP_ENTRY'
      ) {
        throw new ConflictException(
          'The provided email address is already in use.',
        );
      }
      throw new InternalServerErrorException(
        'An unexpected database error occurred.',
      );
    }
  }

  async login(loginDto: LoginDto) {
    const { email, password, role } = loginDto;

    // --- FIX 1: Explicitly fetch the relations here ---
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['volunteer', 'organization', 'admin'],
    });

    if (!user || user.role !== role) {
      throw new UnauthorizedException('Invalid credentials or incorrect role.');
    }

    const isPasswordMatching = await bcrypt.compare(password, user.password);

    if (!isPasswordMatching) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    // --- FIX 2: Include the nested objects in the return data ---
    return {
      access_token: 'session_active_token',
      id: user.id,
      email: user.email,
      role: user.role,
      username: user.username,
      // Pass the relation data to the frontend
      volunteer: user.volunteer,
      organization: user.organization,
    };
  }
}
