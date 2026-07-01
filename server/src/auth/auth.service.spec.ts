import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from '../users/entities/user.entity';
import { Volunteer } from '../volunteers/entities/volunteer.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { MailService } from '../mail/mail.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: Repository<User>;
  let volunteerRepo: Repository<Volunteer>;
  let organizationRepo: Repository<Organization>;
  let mailService: MailService;

  const mockUserRepo = {
    createQueryBuilder: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    manager: {
      query: jest.fn(),
    },
  };

  const mockVolunteerRepo = {
    save: jest.fn(),
  };

  const mockOrganizationRepo = {
    save: jest.fn(),
  };

  const mockMailService = {
    sendPasswordResetEmail: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
        {
          provide: getRepositoryToken(Volunteer),
          useValue: mockVolunteerRepo,
        },
        {
          provide: getRepositoryToken(Organization),
          useValue: mockOrganizationRepo,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock_token'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepo = module.get<Repository<User>>(getRepositoryToken(User));
    volunteerRepo = module.get<Repository<Volunteer>>(
      getRepositoryToken(Volunteer),
    );
    organizationRepo = module.get<Repository<Organization>>(
      getRepositoryToken(Organization),
    );
    mailService = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const createUserDto = {
      email: 'test@example.com',
      password: 'password123',
      role: 'volunteer',
    };

    it('should register a volunteer successfully', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      mockUserRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      const mockSavedUser = {
        id: 'V001',
        email: createUserDto.email,
        password: 'hashedPassword',
        role: 'volunteer',
        username: 'test',
      };
      mockUserRepo.create.mockReturnValue(mockSavedUser);
      mockUserRepo.save.mockResolvedValue(mockSavedUser);
      mockVolunteerRepo.save.mockResolvedValue({});

      const result = await service.register(createUserDto);

      expect(result).toEqual(mockSavedUser);
      expect(mockUserRepo.createQueryBuilder).toHaveBeenCalledWith('user');
      expect(mockUserRepo.create).toHaveBeenCalledWith({
        id: 'V001',
        email: createUserDto.email,
        password: 'hashedPassword',
        role: 'volunteer',
        username: 'test',
      });
      expect(mockVolunteerRepo.save).toHaveBeenCalled();
    });

    it('should register an organization successfully', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({ id: 'O002' }),
      };
      mockUserRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      const mockSavedUser = {
        id: 'O003',
        email: createUserDto.email,
        password: 'hashedPassword',
        role: 'organization',
        username: 'test',
      };
      mockUserRepo.create.mockReturnValue(mockSavedUser);
      mockUserRepo.save.mockResolvedValue(mockSavedUser);
      mockOrganizationRepo.save.mockResolvedValue({});

      const result = await service.register({
        ...createUserDto,
        role: 'organization',
      });

      expect(result).toEqual(mockSavedUser);
      expect(mockOrganizationRepo.save).toHaveBeenCalled();
    });

    it('should throw ConflictException on duplicate email error', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      mockUserRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockUserRepo.create.mockReturnValue({});
      mockUserRepo.save.mockRejectedValue({ code: 'ER_DUP_ENTRY' });

      await expect(service.register(createUserDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
      role: 'volunteer',
    };

    it('should login successfully', async () => {
      const mockUser = {
        id: 'V001',
        email: 'test@example.com',
        password: 'hashedPassword',
        role: 'volunteer',
        username: 'test',
        volunteer: { id: 'V001' },
      };
      mockUserRepo.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockUserRepo.manager.query.mockResolvedValue([]); // Completed apps search

      const result = await service.login(loginDto);

      expect(result).toEqual({
        access_token: 'mock_token',
        id: 'V001',
        email: 'test@example.com',
        role: 'volunteer',
        username: 'test',
        volunteer: { id: 'V001' },
        organization: undefined,
        pendingRating: null,
      });
    });

    it('should throw UnauthorizedException if user role does not match', async () => {
      const mockUser = {
        id: 'V001',
        email: 'test@example.com',
        password: 'hashedPassword',
        role: 'organization',
      };
      mockUserRepo.findOne.mockResolvedValue(mockUser);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password incorrect', async () => {
      const mockUser = {
        id: 'V001',
        email: 'test@example.com',
        password: 'hashedPassword',
        role: 'volunteer',
      };
      mockUserRepo.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should trigger pending rating for volunteer if completed program is unrated', async () => {
      const mockUser = {
        id: 'V001',
        email: 'test@example.com',
        password: 'hashedPassword',
        role: 'volunteer',
        username: 'test',
        volunteer: { id: 'V001' },
      };
      mockUserRepo.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // 1. Mock query for completed upcoming applications
      mockUserRepo.manager.query
        .mockResolvedValueOnce([
          {
            programmeId: 'P001',
            title: 'Eco Clean',
            organizationId: 'O001',
            status: 'Completed',
            completedHours: 3,
          },
        ]) // 2. Mock query to see if rating already exists (empty array = does not exist)
        .mockResolvedValueOnce([])
        // 3. Mock query for organization details
        .mockResolvedValueOnce([
          {
            username: 'EcoOrg',
            profile_picture_url: '/uploads/org.png',
          },
        ]);

      const result = await service.login(loginDto);

      expect(result.pendingRating).toEqual({
        programmeId: 'P001',
        organizationName: 'EcoOrg',
        organizationLogo: '/uploads/org.png',
      });
    });

    it('should trigger pending rating for organization if completed program is unrated', async () => {
      const mockUser = {
        id: 'O001',
        email: 'org@example.com',
        password: 'hashedPassword',
        role: 'organization',
        username: 'ecoorg',
        organization: { id: 'O001' },
      };
      mockUserRepo.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // 1. Mock query for ended programs managed by this organization
      mockUserRepo.manager.query
        .mockResolvedValueOnce([
          {
            id: 'P001',
            title: 'Eco Clean',
          },
        ]) // 2. Mock query to check if organization has already rated (empty = no rating yet)
        .mockResolvedValueOnce([]);

      const result = await service.login({
        email: 'org@example.com',
        password: 'password123',
        role: 'organization',
      });

      expect(result.pendingRating).toEqual({
        programmeId: 'P001',
        organizationName: 'Eco Clean', // It maps title to organizationName (Wait, the DB matches p.title. Let's make sure it equals prog.title)
        organizationLogo: '',
      });
    });
  });

  describe('forgotPassword', () => {
    it('should send reset link to a valid email', async () => {
      const mockUser = {
        email: 'test@example.com',
        resetPasswordToken: null,
      };
      mockUserRepo.findOne.mockResolvedValue(mockUser);
      mockUserRepo.save.mockResolvedValue(mockUser);

      const result = await service.forgotPassword('test@example.com');

      expect(result).toEqual({
        message: 'Reset link dispatched successfully.',
      });
      expect(mockUserRepo.save).toHaveBeenCalled();
      expect(mailService.sendPasswordResetEmail).toHaveBeenCalled();
    });

    it('should throw NotFoundException for invalid email', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(
        service.forgotPassword('invalid@example.com'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully with a valid token', async () => {
      const mockUser = {
        email: 'test@example.com',
        password: 'oldPassword',
        resetPasswordToken: 'validToken',
      };
      mockUserRepo.findOne.mockResolvedValue(mockUser);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword');
      mockUserRepo.save.mockResolvedValue(mockUser);

      const result = await service.resetPassword(
        'validToken',
        'newPassword123',
      );

      expect(result).toEqual({
        message:
          'Your security profile has been successfully re-encrypted and updated.',
      });
      expect(mockUserRepo.save).toHaveBeenCalled();
      expect(mockUser.password).toBe('newHashedPassword');
      expect(mockUser.resetPasswordToken).toBeNull();
    });

    it('should throw BadRequestException for missing token', async () => {
      await expect(service.resetPassword('', 'newPassword')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for invalid token', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(
        service.resetPassword('invalidToken', 'newPassword'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
