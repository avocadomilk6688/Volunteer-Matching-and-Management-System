import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Volunteer } from '../volunteers/entities/volunteer.entity';
import { Admin } from './entities/admin.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { generateCustomId } from '../common/utils/id_generator.util';

jest.mock('../common/utils/id_generator.util');

describe('UsersService', () => {
  let service: UsersService;
  let userRepo: Repository<User>;
  let volunteerRepo: Repository<Volunteer>;
  let adminRepo: Repository<Admin>;
  let organizationRepo: Repository<Organization>;

  const mockRepository = () => ({
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((x) => x),
    save: jest.fn((x) => Promise.resolve(x)),
    update: jest.fn(),
    delete: jest.fn(),
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(Volunteer),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(Admin),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(Organization),
          useValue: mockRepository(),
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepo = module.get<Repository<User>>(getRepositoryToken(User));
    volunteerRepo = module.get<Repository<Volunteer>>(
      getRepositoryToken(Volunteer),
    );
    adminRepo = module.get<Repository<Admin>>(getRepositoryToken(Admin));
    organizationRepo = module.get<Repository<Organization>>(
      getRepositoryToken(Organization),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createVolunteer', () => {
    it('should create volunteer with a shared ID successfully', async () => {
      (generateCustomId as jest.Mock).mockResolvedValue('V001');
      const dto = {
        username: 'vol1',
        email: 'vol1@test.com',
        password: 'pass',
        role: 'volunteer',
        contact_number: '123',
      };

      const result = await service.createVolunteer(dto);

      expect(result).toEqual({
        id: 'V001',
        message: 'Volunteer account and profile created successfully',
      });
      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'V001',
          role: 'volunteer',
        }),
      );
      expect(volunteerRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'V001',
          contact_number: '123',
        }),
      );
      expect(volunteerRepo.save).toHaveBeenCalled();
    });

    it('should create organization with user linkage successfully', async () => {
      (generateCustomId as jest.Mock)
        .mockResolvedValueOnce('ORG001') // Org profile ID
        .mockResolvedValueOnce('U001'); // User ID
      const dto = {
        username: 'org1',
        email: 'org1@test.com',
        password: 'pass',
        role: 'organization',
        contact_number: '999',
      };

      const result = await service.createVolunteer(dto);

      expect(result).toEqual({
        id: 'ORG001',
        message: 'Organization account and profile created successfully',
      });
      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'U001',
          role: 'organization',
        }),
      );
      expect(organizationRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'ORG001',
          contact_number: '999',
        }),
      );
      expect(organizationRepo.save).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should retrieve all users', async () => {
      const mockUsers = [{ id: 'U001' }];
      (userRepo.find as jest.Mock).mockResolvedValue(mockUsers);

      const result = await service.findAll();

      expect(result).toEqual(mockUsers);
      expect(userRepo.find).toHaveBeenCalledWith({
        relations: ['volunteer', 'organization', 'admin'],
      });
    });
  });

  describe('remove', () => {
    it('should throw NotFoundException if user does not exist', async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.remove('U999')).rejects.toThrow(NotFoundException);
    });

    it('should delete volunteer child profile and user parent record successfully', async () => {
      const mockUser = { id: 'V001', role: 'volunteer' };
      (userRepo.findOne as jest.Mock).mockResolvedValue(mockUser);
      (userRepo.delete as jest.Mock).mockResolvedValue({ affected: 1 });

      const result = await service.remove('V001');

      expect(result).toEqual({ deleted: true });
      expect(volunteerRepo.delete).toHaveBeenCalledWith('V001');
      expect(userRepo.delete).toHaveBeenCalledWith('V001');
    });

    it('should delete organization child profile and user parent record successfully', async () => {
      const mockUser = { id: 'U001', role: 'organization' };
      (userRepo.findOne as jest.Mock).mockResolvedValue(mockUser);
      (userRepo.delete as jest.Mock).mockResolvedValue({ affected: 1 });

      const result = await service.remove('U001');

      expect(result).toEqual({ deleted: true });
      expect(organizationRepo.delete).toHaveBeenCalledWith({
        user: { id: 'U001' },
      });
      expect(userRepo.delete).toHaveBeenCalledWith('U001');
    });
  });
});
