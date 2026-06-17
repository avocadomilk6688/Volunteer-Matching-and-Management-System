import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { ProgrammesService, FilterProgrammeParams } from './programmes.service';
import { Programme } from './entities/programme.entity';
import { Schedule } from './entities/schedule.entity';
import { Volunteer } from '../volunteers/entities/volunteer.entity';
import { generateCustomId } from '../common/utils/id_generator.util';

jest.mock('../common/utils/id_generator.util');

describe('ProgrammesService', () => {
  let service: ProgrammesService;
  let programmeRepo: Repository<Programme>;
  let scheduleRepo: Repository<Schedule>;
  let volunteerRepo: Repository<Volunteer>;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    setParameter: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    getMany: jest.fn().mockResolvedValue([]),
    getOne: jest.fn().mockResolvedValue(null),
    getQuery: jest.fn().mockReturnValue('SELECT *'),
  };

  const mockRepository = () => ({
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((x) => x),
    save: jest.fn((x) => Promise.resolve(x)),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
    query: jest.fn(),
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgrammesService,
        {
          provide: getRepositoryToken(Programme),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(Schedule),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(Volunteer),
          useValue: mockRepository(),
        },
      ],
    }).compile();

    service = module.get<ProgrammesService>(ProgrammesService);
    programmeRepo = module.get<Repository<Programme>>(
      getRepositoryToken(Programme),
    );
    scheduleRepo = module.get<Repository<Schedule>>(
      getRepositoryToken(Schedule),
    );
    volunteerRepo = module.get<Repository<Volunteer>>(
      getRepositoryToken(Volunteer),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a new programme', async () => {
      (generateCustomId as jest.Mock)
        .mockResolvedValueOnce('P001')
        .mockResolvedValueOnce('SCH001');

      const dto = {
        title: 'Nature Eco Cleanup',
        description: 'Clean nature park',
        start_time: '2026-07-10T09:00:00Z',
        end_time: '2026-07-10T12:00:00Z',
        mode: 'Physical',
        location: 'Taman Negara',
        organizationId: 'O001',
        skillIds: '["S001"]',
        interestIds: '["I001"]',
      };

      const mockSaved = { id: 'P001', ...dto };
      (programmeRepo.save as jest.Mock).mockResolvedValue(mockSaved);

      const result = await service.create(dto, 'http://image.jpg');

      expect(result).toBeDefined();
      expect(programmeRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'P001',
          title: 'Nature Eco Cleanup',
          imageUrl: 'http://image.jpg',
          schedule: expect.objectContaining({
            id: 'SCH001',
            location: 'Taman Negara',
          }),
        }),
      );
      expect(programmeRepo.save).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should query with correct filters and pagination limit', async () => {
      const mockItems = [{ id: 'P001', title: 'Eco Clean' }];
      mockQueryBuilder.getManyAndCount.mockResolvedValueOnce([mockItems, 1]);

      const filters: FilterProgrammeParams = {
        keyword: 'Clean',
        location: 'Kuala Lumpur',
        skill: 'S001',
        interest: 'I001',
        start: '2026-06-01',
        end: '2026-06-30',
        page: 1,
        limit: 5,
      };

      const result = await service.findAll(filters);

      expect(result).toEqual({
        items: mockItems,
        total: 1,
        page: 1,
        lastPage: 1,
      });
      expect(programmeRepo.createQueryBuilder).toHaveBeenCalled();
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(programme.title LIKE :keyword OR programme.description LIKE :keyword)',
        { keyword: '%Clean%' },
      );
    });
  });

  describe('getRecommended', () => {
    it('should calculate base score for guest user recommendations', async () => {
      const mockItems = [{ id: 'P001', title: 'Eco Clean' }];
      mockQueryBuilder.getManyAndCount.mockResolvedValueOnce([mockItems, 1]);
      mockQueryBuilder.getMany.mockResolvedValueOnce([
        { id: 'P001', related_skills: [], related_interests: [] },
      ]);

      const result = await service.getRecommended(null, {
        location: 'Kuala Lumpur',
      });

      expect(result.items).toBeDefined();
      expect(volunteerRepo.findOne).not.toHaveBeenCalled();
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith(
        expect.stringContaining('(COALESCE(organization.rating, 0) * 5)'),
        'relevance_score',
      );
      expect(mockQueryBuilder.setParameter).toHaveBeenCalledWith(
        'userLoc',
        '%Kuala Lumpur%',
      );
    });

    it('should fetch user profile and apply skill & interest boosts', async () => {
      const mockVolunteer = {
        id: 'V001',
        skills: [{ id: 'S001', skill_name: 'Tree planting' }],
        interests: [{ id: 'I001', interest_name: 'Nature conservation' }],
      };
      (volunteerRepo.findOne as jest.Mock).mockResolvedValue(mockVolunteer);

      // 1 participation, 4 hours worked for S001
      (programmeRepo.query as jest.Mock).mockResolvedValueOnce([
        { skillId: 'S001', participationCount: 1, totalHours: 4 },
      ]);

      const mockItems = [{ id: 'P001', title: 'Eco Clean' }];
      mockQueryBuilder.getManyAndCount.mockResolvedValueOnce([mockItems, 1]);
      mockQueryBuilder.getMany.mockResolvedValueOnce([
        {
          id: 'P001',
          related_skills: [{ id: 'S001' }],
          related_interests: [{ id: 'I001' }],
        },
      ]);

      const result = await service.getRecommended('U001', {});

      expect(result.items).toBeDefined();
      expect(volunteerRepo.findOne).toHaveBeenCalledWith({
        where: { user: { id: 'U001' } },
        relations: ['skills', 'interests'],
      });
      // S001 boost: count*5 + hours*0.5 + 10 = 1*5 + 4*0.5 + 10 = 17 boost points
      expect(mockQueryBuilder.setParameter).toHaveBeenCalledWith(
        'skill_0',
        'S001',
      );
      // I001 boost: flat 15
      expect(mockQueryBuilder.setParameter).toHaveBeenCalledWith(
        'interest_0',
        'I001',
      );
    });
  });

  describe('findOne', () => {
    it('should return a programme with complete relation graphs', async () => {
      const mockProgramme = { id: 'P001', title: 'Eco Clean' };
      (programmeRepo.findOne as jest.Mock).mockResolvedValue(mockProgramme);

      const result = await service.findOne('P001');

      expect(result).toEqual(mockProgramme);
      expect(programmeRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'P001' },
        relations: [
          'schedule',
          'organization',
          'organization.user',
          'related_skills',
          'related_interests',
          'saved_by',
        ],
      });
    });

    it('should throw NotFoundException if program does not exist', async () => {
      (programmeRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne('P999')).rejects.toThrow(NotFoundException);
    });
  });
});
