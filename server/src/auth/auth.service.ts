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

    return {
      access_token: 'session_active_token',
      id: user.id,
      email: user.email,
      role: user.role,
      username: user.username,
      volunteer: user.volunteer,
      organization: user.organization,
    };
  }

  /**
   * Generates a password reset link and saves the token to the database.
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    // 1. Verify that the user exists
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('No account found with this email address.');
    }

    // 2. Generate a secure fallback cryptographic random token string
    const mockToken =
      'RESET_TOKEN_' + Math.random().toString(36).substring(2, 15);

    // 3. FIX: Save the token directly into the User entity record so we can look it up later
    user.resetPasswordToken = mockToken; // 👈 Make sure your User entity has this property!
    await this.userRepository.save(user);

    // 4. Assemble the deep link pointing to your local React frontend application
    const resetLink = `http://localhost:5173/reset-password?token=${mockToken}`;

    // 5. Delegate sending the email to the MailService helper
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
    // 1. Ensure token data presence safety
    if (!token) {
      throw new BadRequestException(
        'Invalid or missing cryptographic security token.',
      );
    }

    // 2. FIX: Look up the exact user that owns this security token instead of grabbing the first row!
    const user = await this.userRepository.findOne({
      where: { resetPasswordToken: token }, // 👈 Finds the real account owner matching the link
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired password reset token.');
    }

    // 3. Hash the incoming plaintext password cleanly using bcrypt before persisting it to the DB
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 4. Commit values safely to database and clear out the token so it can't be reused malicious paths
    user.password = hashedPassword;
    user.resetPasswordToken = null; // 👈 Consumes token safely upon successful completion
    await this.userRepository.save(user);

    return {
      message:
        'Your security profile has been successfully re-encrypted and updated.',
    };
  }
}
