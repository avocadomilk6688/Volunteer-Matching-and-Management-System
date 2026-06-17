import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { Organization } from './entities/organization.entity';
import { OrganizationRegistration } from './entities/organization-registration.entity';
import { User } from '../users/entities/user.entity';
import { generateCustomId } from '../common/utils/id_generator.util';

jest.mock('../common/utils/id_generator.util');

describe('OrganizationsService', () => {
  let service: OrganizationsService;
  let orgRepo: Repository<Organization>;
  let regRepo: Repository<OrganizationRegistration>;

  const mockRepository = () => ({
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((x) => x),
    save: jest.fn((x) => Promise.resolve(x)),
    update: jest.fn(),
    delete: jest.fn(),
    manager: {
      update: jest.fn(),
    },
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        {
          provide: getRepositoryToken(Organization),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(OrganizationRegistration),
          useValue: mockRepository(),
        },
      ],
    }).compile();

    service = module.get<OrganizationsService>(OrganizationsService);
    orgRepo = module.get<Repository<Organization>>(
      getRepositoryToken(Organization),
    );
    regRepo = module.get<Repository<OrganizationRegistration>>(
      getRepositoryToken(OrganizationRegistration),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createVerificationRegistration', () => {
    it('should create and save a new registration', async () => {
      (generateCustomId as jest.Mock).mockResolvedValue('REG001');
      const dto = {
        organizationName: 'EcoOrg',
        authorizedPersonName: 'John Doe',
        description: 'Eco Org Description',
        address: 'KL',
        supporting_documents: ['doc.pdf'],
      };

      const result = await service.createVerificationRegistration(dto);

      expect(result).toBeDefined();
      expect(regRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'REG001',
          organizationName: 'EcoOrg',
          authorizedPersonName: 'John Doe',
        }),
      );
      expect(regRepo.save).toHaveBeenCalled();
    });
  });

  describe('findAllPendingRegistrations', () => {
    it('should fetch pending registrations and split authorized person names containing pipes', async () => {
      const mockRecords = [
        {
          id: 'REG001',
          status: 'pending',
          authorizedPersonName: 'John Doe|U001',
        },
      ];
      (regRepo.find as jest.Mock).mockResolvedValue(mockRecords);

      const result = await service.findAllPendingRegistrations();

      expect(result[0].authorizedPersonName).toBe('John Doe');
      expect(regRepo.find).toHaveBeenCalledWith({
        where: { status: 'pending' },
        order: { submission_time: 'DESC' },
      });
    });
  });

  describe('findOneRegistration', () => {
    it('should retrieve a registration directly by primary key ID', async () => {
      const mockReg = { id: 'REG001', authorizedPersonName: 'John Doe' };
      (regRepo.findOne as jest.Mock).mockResolvedValue(mockReg);

      const result = await service.findOneRegistration('REG001');

      expect(result).toEqual(mockReg);
      expect(regRepo.findOne).toHaveBeenCalledWith({ where: { id: 'REG001' } });
    });

    it('should perform fallback scan search using pipe value matching if primary lookup fails', async () => {
      (regRepo.findOne as jest.Mock).mockResolvedValue(null);
      const mockRecords = [
        { id: 'REG001', authorizedPersonName: 'John Doe|U001' },
      ];
      (regRepo.find as jest.Mock).mockResolvedValue(mockRecords);

      const result = await service.findOneRegistration('U001');

      expect(result).toEqual(mockRecords[0]);
    });

    it('should throw NotFoundException if no registration matches', async () => {
      (regRepo.findOne as jest.Mock).mockResolvedValue(null);
      (regRepo.find as jest.Mock).mockResolvedValue([]);

      await expect(service.findOneRegistration('REG999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateRegistration', () => {
    it('should update registration status', async () => {
      const mockReg = {
        id: 'REG001',
        status: 'pending',
        authorizedPersonName: 'John Doe',
      };
      (regRepo.findOne as jest.Mock)
        .mockResolvedValueOnce(mockReg)
        .mockResolvedValueOnce({ ...mockReg, status: 'approved' });

      const result = await service.updateRegistration('REG001', {
        status: 'approved',
      });

      expect(result.status).toBe('approved');
      expect(regRepo.update).toHaveBeenCalledWith('REG001', {
        status: 'approved',
      });
    });

    it('should seed custom row in Organization profile when approved and contains user pipe identifier', async () => {
      const mockReg = {
        id: 'REG001',
        status: 'pending',
        authorizedPersonName: 'John Doe|U001',
        description: 'Eco Guardians',
      };
      (regRepo.findOne as jest.Mock)
        .mockResolvedValueOnce(mockReg) // Initial search
        .mockResolvedValueOnce({ ...mockReg, status: 'approved' }); // Post-update search

      (orgRepo.findOne as jest.Mock).mockResolvedValue(null); // Profile does not exist yet
      (generateCustomId as jest.Mock).mockResolvedValue('O001');

      const result = await service.updateRegistration('REG001', {
        status: 'approved',
      });

      expect(result.authorizedPersonName).toBe('John Doe'); // Strip pipe on return
      expect(orgRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'O001',
          description: 'Eco Guardians',
          user: { id: 'U001' },
        }),
      );
      expect(orgRepo.save).toHaveBeenCalled();
    });
  });

  describe('findOne profile', () => {
    it('should attempt fallback search using user context ID relation directly', async () => {
      const mockOrg = { id: 'O001', user: { id: 'U001' } };
      (orgRepo.findOne as jest.Mock).mockResolvedValueOnce(mockOrg);

      const result = await service.findOne('U001');

      expect(result).toEqual(mockOrg);
      expect(orgRepo.findOne).toHaveBeenCalledWith({
        where: { user: { id: 'U001' } },
        relations: ['registrationRecord', 'user'],
      });
    });

    it('should search by raw target primary profile ID if user context ID lookup fails', async () => {
      (orgRepo.findOne as jest.Mock)
        .mockResolvedValueOnce(null) // First query
        .mockResolvedValueOnce({ id: 'O001' }); // Second query

      const result = await service.findOne('O001');

      expect(result).toEqual({ id: 'O001' });
      expect(orgRepo.findOne).toHaveBeenLastCalledWith({
        where: { id: 'O001' },
        relations: ['registrationRecord', 'user'],
      });
    });

    it('should throw NotFoundException if profile not found in both paths', async () => {
      (orgRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne('invalid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update profile', () => {
    it('should update organization profile and cascading user/registration record info', async () => {
      const mockOrg = {
        id: 'O001',
        user: { id: 'U001' },
        registrationRecord: { id: 'REG001' },
      };
      (orgRepo.findOne as jest.Mock).mockResolvedValue(mockOrg); // For findOne inside update

      const updateDto = {
        username: 'new_eco',
        email: 'new@eco.com',
        address: 'New Address',
        description: 'New Description',
      };

      await service.update('O001', updateDto);

      // Verify user updates
      expect(orgRepo.manager.update).toHaveBeenCalledWith(User, 'U001', {
        username: 'new_eco',
        email: 'new@eco.com',
      });
      // Verify registration record updates
      expect(regRepo.update).toHaveBeenCalledWith('REG001', {
        address: 'New Address',
      });
      // Verify organization profile updates
      expect(orgRepo.update).toHaveBeenCalledWith('O001', {
        description: 'New Description',
      });
    });
  });
});
