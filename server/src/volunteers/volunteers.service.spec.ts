import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { VolunteersService, UpdateProfileDto } from './volunteers.service';
import { Volunteer } from './entities/volunteer.entity';
import { User } from '../users/entities/user.entity';
import { Skill } from './entities/skill.entity';
import { Interest } from './entities/interest.entity';
import { VolunteerMonthlyPoint } from './entities/volunteer-monthly-point.entity';
import { Application } from '../applications/entities/application.entity';
import { generateCustomId } from '../common/utils/id_generator.util';

jest.mock('../common/utils/id_generator.util');

describe('VolunteersService', () => {
  let service: VolunteersService;
  let volRepo: Repository<Volunteer>;
  let userRepo: Repository<User>;
  let skillRepo: Repository<Skill>;
  let interestRepo: Repository<Interest>;
  let monthlyRepo: Repository<VolunteerMonthlyPoint>;
  let applicationRepo: Repository<Application>;

  const mockRepository = () => ({
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((x) => x),
    save: jest.fn((x) => Promise.resolve(x)),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getSql: jest.fn().mockReturnValue('SELECT *'),
      getMany: jest.fn(),
    })),
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VolunteersService,
        {
          provide: getRepositoryToken(Volunteer),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(Skill),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(Interest),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(VolunteerMonthlyPoint),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(Application),
          useValue: mockRepository(),
        },
      ],
    }).compile();

    service = module.get<VolunteersService>(VolunteersService);
    volRepo = module.get<Repository<Volunteer>>(getRepositoryToken(Volunteer));
    userRepo = module.get<Repository<User>>(getRepositoryToken(User));
    skillRepo = module.get<Repository<Skill>>(getRepositoryToken(Skill));
    interestRepo = module.get<Repository<Interest>>(
      getRepositoryToken(Interest),
    );
    monthlyRepo = module.get<Repository<VolunteerMonthlyPoint>>(
      getRepositoryToken(VolunteerMonthlyPoint),
    );
    applicationRepo = module.get<Repository<Application>>(
      getRepositoryToken(Application),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getLeaderboard', () => {
    it('should fetch leaderboard points DESC for month/year and limit to 10', async () => {
      const mockPoints = [
        { id: 1, points: 100, volunteer: { id: 'V001' } },
        { id: 2, points: 90, volunteer: { id: 'V002' } },
      ];
      (monthlyRepo.find as jest.Mock).mockResolvedValue(mockPoints);

      const result = await service.getLeaderboard(6, 2026);

      expect(result).toEqual(mockPoints);
      expect(monthlyRepo.find).toHaveBeenCalledWith({
        where: { month: 6, year: 2026 },
        relations: ['volunteer', 'volunteer.user'],
        order: { points: 'DESC' },
        take: 10,
      });
    });
  });

  describe('createSkill & createInterest', () => {
    it('should create and save a new skill with custom ID', async () => {
      (generateCustomId as jest.Mock).mockResolvedValue('S001');
      const mockSkill = { id: 'S001', skill_name: 'Cooking' };
      (skillRepo.save as jest.Mock).mockResolvedValue(mockSkill);

      const result = await service.createSkill('Cooking');

      expect(result).toEqual(mockSkill);
      expect(generateCustomId).toHaveBeenCalledWith(skillRepo, 'S');
      expect(skillRepo.create).toHaveBeenCalledWith({
        id: 'S001',
        skill_name: 'Cooking',
      });
    });

    it('should create and save a new interest with custom ID', async () => {
      (generateCustomId as jest.Mock).mockResolvedValue('I001');
      const mockInterest = { id: 'I001', interest_name: 'Environment' };
      (interestRepo.save as jest.Mock).mockResolvedValue(mockInterest);

      const result = await service.createInterest('Environment');

      expect(result).toEqual(mockInterest);
      expect(generateCustomId).toHaveBeenCalledWith(interestRepo, 'I');
      expect(interestRepo.create).toHaveBeenCalledWith({
        id: 'I001',
        interest_name: 'Environment',
      });
    });
  });

  describe('findVolunteersByProgramme', () => {
    it('should fetch volunteers with Completed status for a specific program', async () => {
      const mockVolunteers = [{ id: 'V001' }, { id: 'V002' }];
      const queryBuilder = volRepo.createQueryBuilder();
      (queryBuilder.getMany as jest.Mock).mockResolvedValue(mockVolunteers);
      (volRepo.createQueryBuilder as jest.Mock).mockReturnValue(queryBuilder);

      const result = await service.findVolunteersByProgramme('P001');

      expect(result).toEqual(mockVolunteers);
      expect(volRepo.createQueryBuilder).toHaveBeenCalledWith('volunteer');
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'volunteer.user',
        'user',
      );
      expect(queryBuilder.innerJoin).toHaveBeenCalledWith(
        'volunteer.applications',
        'application',
      );
      expect(queryBuilder.where).toHaveBeenCalledWith(
        'application.programmeId = :programmeId',
        { programmeId: 'P001' },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'LOWER(application.status) = :status',
        { status: 'completed' },
      );
    });
  });

  describe('update', () => {
    it('should update profile and trigger cascading user saving', async () => {
      const mockUser = {
        id: 'V001',
        username: 'olduser',
        email: 'old@example.com',
      };
      const mockVolunteer = {
        id: 'V001',
        gender: 'Female',
        location: 'Kuala Lumpur',
        contact_number: '123',
        user: mockUser,
        skills: [],
        interests: [],
      } as unknown as Volunteer;

      (volRepo.findOne as jest.Mock).mockResolvedValue(mockVolunteer);
      (volRepo.save as jest.Mock).mockResolvedValue(mockVolunteer);

      const updateDto: UpdateProfileDto = {
        username: 'newuser',
        email: 'new@example.com',
        gender: 'Male',
        location: 'Penang',
        contact_number: '999',
        skills: '[{"id":"S001"}]',
        interests: '[{"id":"I001"}]',
      };

      const result = await service.update('V001', updateDto);

      expect(result).toBeDefined();
      expect(userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'newuser',
          email: 'new@example.com',
        }),
      );
      expect(volRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          gender: 'Male',
          location: 'Penang',
          contact_number: '999',
          skills: [{ id: 'S001' }],
          interests: [{ id: 'I001' }],
        }),
      );
    });

    it('should return null if volunteer not found', async () => {
      (volRepo.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.update('V002', {});
      expect(result).toBeNull();
    });
  });

  describe('completeProgramme', () => {
    it('should calculate points and update/create monthly record', async () => {
      const mockApp = {
        id: 'A001',
        volunteer: { id: 'V001', rating: 4.5 },
        programme: {
          schedule: {
            start_time: new Date('2026-06-15T10:00:00Z'),
            end_time: new Date('2026-06-15T14:00:00Z'), // 4 hours
          },
        },
      };

      (applicationRepo.findOne as jest.Mock).mockResolvedValue(mockApp);
      (monthlyRepo.findOne as jest.Mock).mockResolvedValue(null); // No existing monthly record

      const result = await service.completeProgramme('A001');

      expect(result).toBeDefined();
      // 4 hours * 4.5 rating = 18 points
      expect(monthlyRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          volunteer: mockApp.volunteer,
          totalHours: 4,
          points: 18,
        }),
      );
      expect(monthlyRepo.save).toHaveBeenCalled();
    });

    it('should accumulate points on existing monthly record', async () => {
      const mockApp = {
        id: 'A001',
        volunteer: { id: 'V001', rating: 5.0 },
        programme: {
          schedule: {
            start_time: new Date('2026-06-15T10:00:00Z'),
            end_time: new Date('2026-06-15T12:00:00Z'), // 2 hours
          },
        },
      };

      const existingRecord = {
        volunteer: { id: 'V001' },
        month: 6,
        year: 2026,
        totalHours: 5,
        points: 25,
      };

      (applicationRepo.findOne as jest.Mock).mockResolvedValue(mockApp);
      (monthlyRepo.findOne as jest.Mock).mockResolvedValue(existingRecord);

      await service.completeProgramme('A001');

      // 2 hours * 5.0 = 10 points. Cumulative: 7 hours, 35 points
      expect(existingRecord.totalHours).toBe(7);
      expect(existingRecord.points).toBe(35);
      expect(monthlyRepo.save).toHaveBeenCalledWith(existingRecord);
    });

    it('should throw NotFoundException if application not found', async () => {
      (applicationRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.completeProgramme('A999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getHistory', () => {
    it('should return complete history and aggregate hours', async () => {
      const mockVolunteer = {
        id: 'V001',
        rating: 4.8,
        applications: [{ id: 'A001', status: 'completed' }],
      };
      (volRepo.findOne as jest.Mock).mockResolvedValue(mockVolunteer);

      const mockMonthlyLogs = [{ totalHours: 10 }, { totalHours: 15 }];
      (monthlyRepo.find as jest.Mock).mockResolvedValue(mockMonthlyLogs);

      const result = await service.getHistory('V001');

      expect(result).toEqual({
        rating: 4.8,
        totalHours: 25,
        history: mockVolunteer.applications,
      });
    });

    it('should return null if volunteer not found', async () => {
      (volRepo.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.getHistory('V999');
      expect(result).toBeNull();
    });
  });
});
