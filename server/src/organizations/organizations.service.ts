import { Injectable } from '@nestjs/common';
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

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,

    @InjectRepository(OrganizationRegistration)
    private readonly regRepo: Repository<OrganizationRegistration>,
  ) {}

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
    return await this.regRepo.findOne({ where: { id } });
  }

  async updateRegistration(id: string, updateDto: any) {
    await this.regRepo.update(id, updateDto);
    return await this.findOneRegistration(id);
  }

  async removeRegistration(id: string) {
    const result = await this.regRepo.delete(id);
    return { deleted: (result.affected ?? 0) > 0 };
  }

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
    return await this.orgRepo.findOne({
      where: { id },
      relations: ['registrationRecord', 'user'],
    });
  }

  async update(id: string, updateDto: any) {
    await this.orgRepo.update(id, updateDto);
    return this.findOne(id);
  }

  async remove(id: string) {
    const result = await this.orgRepo.delete(id);
    return { deleted: (result.affected ?? 0) > 0 };
  }
}
