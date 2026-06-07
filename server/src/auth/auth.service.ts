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
import { Volunteer } from '../volunteers/entities/volunteer.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { MailService } from '../mail/mail.service';

interface RawRatingRow {
  id: string;
}

interface RawOrganizationRow {
  name: string;
  profile_picture_url: string;
}

interface RawVolunteerAppRow {
  programmeId: string;
  title: string;
  organizationId: string | null;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Volunteer)
    private volunteerRepository: Repository<Volunteer>,

    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,

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
      username: email.split('@')[0],
    });

    try {
      const savedUser = await this.userRepository.save(user);

      // ─── STRICT TYPE-SAFE INSTANTIATION (OMITTING NULL ASSIGNMENTS) ───
      if (role === 'volunteer') {
        const volunteerProfile = new Volunteer();
        volunteerProfile.id = newId;
        volunteerProfile.rating = 0.0;
        volunteerProfile.points = 0;
        volunteerProfile.user = savedUser;

        // ─── SET RELATIVE CLIENT PUBLIC ASSET LINK AS DEFAULT ───
        volunteerProfile.profile_picture_url =
          '/images/default_profile_pic.png';

        await this.volunteerRepository.save(volunteerProfile);
      } else if (role === 'organization') {
        const organizationProfile = new Organization();
        organizationProfile.id = newId;
        organizationProfile.rating = 0.0;
        organizationProfile.user = savedUser;

        await this.organizationRepository.save(organizationProfile);
      }

      return savedUser;
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

    const user = await this.userRepository.findOne({
      where: { email },
      relations: [
        'volunteer',
        'organization',
        'organization.registrationRecord',
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

    let pendingRatingTrigger: {
      programmeId: string;
      organizationName: string;
      organizationLogo: string;
    } | null = null;

    try {
      if (user.role === 'volunteer') {
        const currentTime = new Date();

        // ─── AUTOMATED TIMELINE RECONCILIATION ENGINE ───
        // Queries records that were approved, have passed their end date timeline, and remain unrated
        const completedApps: RawVolunteerAppRow[] =
          await this.userRepository.manager.query(
            `SELECT a.programmeId, p.title, p.organizationId 
             FROM application a
             JOIN programme p ON a.programmeId = p.id
             JOIN schedule s ON p.scheduleId = s.id
             WHERE a.volunteerId = ? 
               AND a.status = 'approved' 
               AND s.end_time < ? 
               AND a.isRatedByVolunteer = 0`,
            [user.id, currentTime],
          );

        for (const app of completedApps) {
          const ratingExists: RawRatingRow[] =
            await this.userRepository.manager.query(
              `SELECT id FROM interaction_rating WHERE programmeId = ? AND senderId = ? LIMIT 1`,
              [app.programmeId, user.id],
            );

          if (!ratingExists || ratingExists.length === 0) {
            let orgName = 'EcoGuardians Malaysia';
            let orgLogo = '';

            if (app.organizationId) {
              const orgData: RawOrganizationRow[] =
                await this.userRepository.manager.query(
                  `SELECT name, profile_picture_url FROM organization WHERE id = ? LIMIT 1`,
                  [app.organizationId],
                );

              if (orgData && orgData.length > 0) {
                orgName = orgData[0].name || orgName;
                orgLogo = orgData[0].profile_picture_url || orgLogo;
              }
            }

            pendingRatingTrigger = {
              programmeId: app.programmeId,
              organizationName: orgName,
              organizationLogo: orgLogo,
            };
            break; // Stop loop once an applicable unrated record intercepts the thread
          }
        }
      }
    } catch (err) {
      console.error('[TIMELINE APPLICATION EXTENSION SCANNING ERROR]:', err);
    }

    const organizationPayload = user.organization
      ? {
          ...user.organization,
          id: user.organization.id || user.id,
        }
      : undefined;

    return {
      access_token: 'session_active_token',
      id: user.id,
      email: user.email,
      role: user.role,
      username: user.username,
      volunteer: user.volunteer,
      organization: organizationPayload,
      pendingRating: pendingRatingTrigger,
    };
  }

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
