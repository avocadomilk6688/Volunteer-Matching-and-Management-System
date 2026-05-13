import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './entities/organization.entity';
import { OrganizationRegistration } from './entities/organization-registration.entity';
import {
  CreateOrganizationDto,
  CreateOrganizationRegistrationDto,
} from './dto/create-organization.dto';
import { generateCustomId } from '../common/utils/id_generator.util';
import { User } from '../users/entities/user.entity';

// --- Define an Interface for the Update Payload ---
// This tells TypeScript exactly what fields might come from the frontend
interface UpdateOrgPayload {
  username?: string;
  email?: string;
  password?: string;
  address?: string;
  description?: string;
  contact_number?: string;
  profile_picture_url?: string;
}

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,

    @InjectRepository(OrganizationRegistration)
    private readonly regRepo: Repository<OrganizationRegistration>,
  ) {}

  // --- Registration Record Methods ---

  async createRegistration(dto: CreateOrganizationRegistrationDto) {
    const id = await generateCustomId(this.regRepo, 'REG');
    const newReg = this.regRepo.create({
      id,
      ...dto,
      submission_time: new Date(),
      status: 'pending',
    });
    return await this.regRepo.save(newReg);
  }

  async findAllRegistrations() {
    return await this.regRepo.find();
  }

  async findOneRegistration(id: string) {
    const reg = await this.regRepo.findOne({ where: { id } });
    if (!reg) throw new NotFoundException(`Registration ${id} not found`);
    return reg;
  }

  async updateRegistration(
    id: string,
    updateDto: Partial<CreateOrganizationRegistrationDto>,
  ) {
    await this.regRepo.update(id, updateDto);
    return await this.findOneRegistration(id);
  }

  async removeRegistration(id: string) {
    const result = await this.regRepo.delete(id);
    return { deleted: (result.affected ?? 0) > 0 };
  }

  // --- Organization Profile Methods ---

  async create(dto: CreateOrganizationDto) {
    const id = await generateCustomId(this.orgRepo, 'ORG');
    const newOrg = this.orgRepo.create({
      id,
      ...dto,
      registrationRecord: {
        id: dto.registrationRecordId,
      } as OrganizationRegistration,
      user: { id: dto.userId } as User,
    });
    return await this.orgRepo.save(newOrg);
  }

  async findAll() {
    return await this.orgRepo.find({
      relations: ['registrationRecord', 'user'],
    });
  }

  async findOne(id: string) {
    const org = await this.orgRepo.findOne({
      where: { id },
      relations: ['registrationRecord', 'user'],
    });
    if (!org) throw new NotFoundException(`Organization ${id} not found`);
    return org;
  }

  /**
   * Updates Organization, Linked User, and Linked Registration Record
   */
  async update(id: string, updateDto: UpdateOrgPayload) {
    const org = await this.orgRepo.findOne({
      where: { id },
      relations: ['registrationRecord', 'user'],
    });

    if (!org) throw new NotFoundException('Organization not found');

    // 1. Handle User Table Updates
    // We use Partial<User> to ensure type safety
    const userData: Partial<User> = {};
    if (updateDto.username) userData.username = updateDto.username;
    if (updateDto.email) userData.email = updateDto.email;
    if (updateDto.password) userData.password = updateDto.password;

    if (Object.keys(userData).length > 0 && org.user) {
      await this.orgRepo.manager.update(User, org.user.id, userData);
    }

    // 2. Handle Registration Table Updates
    if (updateDto.address && org.registrationRecord) {
      await this.regRepo.update(org.registrationRecord.id, {
        address: updateDto.address,
      });
    }

    // 3. Handle Organization Table Updates
    const orgUpdateData: Partial<Organization> = {};
    if (updateDto.description)
      orgUpdateData.description = updateDto.description;
    if (updateDto.contact_number)
      orgUpdateData.contact_number = updateDto.contact_number;
    if (updateDto.profile_picture_url)
      orgUpdateData.profile_picture_url = updateDto.profile_picture_url;

    if (Object.keys(orgUpdateData).length > 0) {
      await this.orgRepo.update(id, orgUpdateData);
    }

    return this.findOne(id);
  }

  async remove(id: string) {
    const result = await this.orgRepo.delete(id);
    return { deleted: (result.affected ?? 0) > 0 };
  }
}
