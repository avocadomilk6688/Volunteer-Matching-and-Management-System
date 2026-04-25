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

// AuthService manages business logic for user authentication and authorization
@Injectable()
export class AuthService {
  // Injects the User repository to facilitate database operations
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // Handles user registration including password hashing and database persistence
  async register(createUserDto: CreateUserDto): Promise<User> {
    const { email, password, role } = createUserDto;

    // Generate the custom ID (V001, V002, etc.)
    const prefix = role === 'volunteer' ? 'V' : 'O';

    // Finds the most recent user with the same role prefix to determine the next ID sequence.
    const lastUser = await this.userRepository
      .createQueryBuilder('user')
      .where('user.id LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('user.id', 'DESC')
      .getOne();

    // Extracts the numeric part of the last ID or defaults to 0 if no users exist.
    const lastIdNumber = lastUser ? parseInt(lastUser.id.substring(1)) : 0;

    // Increments the count and pads it with zeros to maintain the three-digit format.
    const newId = `${prefix}${String(lastIdNumber + 1).padStart(3, '0')}`;

    // Hash the password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create the user with the NEW custom ID
    const user = this.userRepository.create({
      id: newId,
      email,
      password: hashedPassword,
      role,
    });

    try {
      return await this.userRepository.save(user);
    } catch (error: unknown) {
      console.error('DATABASE_SAVE_ERROR:', error);
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

    // Searches the database for a user with the provided email address.
    const user = await this.userRepository.findOne({ where: { email } });

    // Checks if the user exists and if their assigned role matches the login attempt.
    if (!user || user.role !== role) {
      throw new UnauthorizedException('Invalid credentials or incorrect role.');
    }

    // Compares the plain-text password with the hashed password stored in the database.
    const isPasswordMatching = await bcrypt.compare(password, user.password);

    if (!isPasswordMatching) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    // Returns user details and a mock token upon successful verification.
    return {
      access_token: 'session_active_token',
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.username,
    };
  }
}
