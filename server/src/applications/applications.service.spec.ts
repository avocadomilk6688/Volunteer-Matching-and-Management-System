import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import {
  ApplicationsService,
  IncomingApplicationDto,
} from './applications.service';
import { Application } from './entities/application.entity';
import { Volunteer } from '../volunteers/entities/volunteer.entity';
import { Notification } from '../interactions/entities/notification.entity';
import { generateCustomId } from '../common/utils/id_generator.util';

jest.mock('../common/utils/id_generator.util');

describe('ApplicationsService', () => {
  let service: ApplicationsService;
  let appRepo: Repository<Application>;
  let volunteerRepo: Repository<Volunteer>;
  let notifRepo: Repository<Notification>;

  const mockRepository = () => ({
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((x) => x),
    save: jest.fn((x) => Promise.resolve(x)),
    delete: jest.fn(),
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationsService,
        {
          provide: getRepositoryToken(Application),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(Volunteer),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(Notification),
          useValue: mockRepository(),
        },
      ],
    }).compile();

    service = module.get<ApplicationsService>(ApplicationsService);
    appRepo = module.get<Repository<Application>>(
      getRepositoryToken(Application),
    );
    volunteerRepo = module.get<Repository<Volunteer>>(
      getRepositoryToken(Volunteer),
    );
    notifRepo = module.get<Repository<Notification>>(
      getRepositoryToken(Notification),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllByOrg', () => {
    it('should find applications belonging to the organization', async () => {
      const mockApps = [
        { id: 'A001', programme: { organization: { id: 'O001' } } },
      ];
      (appRepo.find as jest.Mock).mockResolvedValue(mockApps);

      const result = await service.findAllByOrg('O001');

      expect(result).toEqual(mockApps);
      expect(appRepo.find).toHaveBeenCalledWith({
        where: { programme: { organization: { id: 'O001' } } },
        relations: expect.any(Array),
      });
    });
  });

  describe('checkStatus', () => {
    it('should return enrolled: true and status if application exists', async () => {
      (appRepo.findOne as jest.Mock).mockResolvedValue({ status: 'pending' });

      const result = await service.checkStatus('V001', 'P001');

      expect(result).toEqual({ enrolled: true, status: 'pending' });
    });

    it('should return enrolled: false if application does not exist', async () => {
      (appRepo.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.checkStatus('V001', 'P001');

      expect(result).toEqual({ enrolled: false, status: null });
    });
  });

  describe('create', () => {
    const dto: IncomingApplicationDto = {
      volunteerId: 'V001',
      programmeId: 'P001',
      skills: '[{"id":"S001"}]',
      interests: '[{"id":"I001"}]',
    };

    it('should throw BadRequestException if arguments are missing', async () => {
      await expect(service.create(null as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if volunteer is not found', async () => {
      (volunteerRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });

    it('should successfully apply and update volunteer profile with skills/interests/resume', async () => {
      const mockVolunteer = {
        id: 'V001',
        skills: [],
        interests: [],
        resume_url: '',
      };
      (volunteerRepo.findOne as jest.Mock).mockResolvedValue(mockVolunteer);
      (generateCustomId as jest.Mock).mockResolvedValue('APP001');

      const mockFile = { filename: 'resume.pdf' } as Express.Multer.File;

      const result = await service.create(dto, mockFile);

      expect(result).toBeDefined();
      expect(volunteerRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          skills: [{ id: 'S001' }],
          interests: [{ id: 'I001' }],
          resume_url: '/uploads/resumes/resume.pdf',
        }),
      );
      expect(appRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'APP001',
          status: 'pending',
        }),
      );
      expect(appRepo.save).toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('should throw NotFoundException if application not found', async () => {
      (appRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.updateStatus('A999', 'upcoming')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should approve application and create custom user notification', async () => {
      const mockApp = {
        id: 'A001',
        status: 'pending',
        volunteer: { id: 'V001', user: { id: 'U001' } },
        programme: { title: 'Eco Clean' },
      };
      (appRepo.findOne as jest.Mock).mockResolvedValue(mockApp);
      (generateCustomId as jest.Mock).mockResolvedValue('NOT001');

      // Mock notification instantiation
      const mockNotif = { id: '' } as any;
      (notifRepo.create as jest.Mock).mockReturnValue(mockNotif);

      const result = await service.updateStatus('A001', 'upcoming');

      expect(result.status).toBe('upcoming');
      expect(notifRepo.create).toHaveBeenCalled();
      expect(mockNotif.id).toBe('NOT001');
      expect(mockNotif.content).toContain('approved');
      expect(notifRepo.save).toHaveBeenCalledWith(mockNotif);
    });
  });

  describe('remove', () => {
    it('should return deleted: true if application was deleted', async () => {
      (appRepo.delete as jest.Mock).mockResolvedValue({ affected: 1 });

      const result = await service.remove('A001');

      expect(result).toEqual({ deleted: true });
    });
  });
});
