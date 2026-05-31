import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly mailService: MailService,
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
      role: role as 'admin' | 'volunteer' | 'organization',
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

    // Eagerly joins 'organization_registration' columns securely matching your Entity structures
    const user = await this.userRepository.findOne({
      where: { email },
      relations: [
        'volunteer',
        'organization',
        'organization.registrationRecord', // Eager multi-level join
        'admin',
      ],
    });

    if (!user || user.role !== role) {
      throw new UnauthorizedException('Invalid credentials or incorrect role.');
    }

    const isPasswordMatching = await bcrypt.compare(password, user.password);

    if (!isPasswordMatching) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    // ─── FIXED: DATA STRUCTURE NORMALIZATION ───
    // If an organization profile exists, explicitly attach and overwrite its 'id' property
    // to mirror the core 'user.id' ("O002"). This forces the untouched ManageListingPage filter
    // ("item.organization?.id === user?.id") to always find a perfect string match!
    const organizationPayload = user.organization
      ? {
          ...user.organization,
          id: user.organization.id || user.id,
        }
      : undefined;

    return {
      access_token: 'session_active_token',
      id: user.id, // "O002"
      email: user.email,
      role: user.role,
      username: user.username,
      volunteer: user.volunteer,
      organization: organizationPayload,
    };
  }

  /**
   * Generates a password reset link and saves the token to the database.
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('No account found with this email address.');
    }

    const mockToken =
      'RESET_TOKEN_' + Math.random().toString(36).substring(2, 15);

    user.resetPasswordToken = mockToken;
    await this.userRepository.save(user);

    const resetLink = `http://localhost:5173/reset-password?token=${mockToken}`;
    await this.mailService.sendPasswordResetEmail(email, resetLink);

    return { message: 'Reset link dispatched successfully.' };
  }

  /**
   * Verifies incoming token validity and commits the new encrypted password string to the MySQL database instance.
   */
  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    if (!token) {
      throw new BadRequestException(
        'Invalid or missing cryptographic security token.',
      );
    }

    const user = await this.userRepository.findOne({
      where: { resetPasswordToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired password reset token.');
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.resetPasswordToken = null;
    await this.userRepository.save(user);

    return {
      message:
        'Your security profile has been successfully re-encrypted and updated.',
    };
  }
}
