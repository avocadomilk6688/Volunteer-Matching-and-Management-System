import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './entities/organization.entity';
import { OrganizationRegistration } from './entities/organization-registration.entity';
import {
  CreateOrganizationDto,
  CreateOrganizationRegistrationDto,
  UpdateOrganizationRegistrationDto,
} from './dto/create-organization.dto';
import { generateCustomId } from '../common/utils/id_generator.util';
import { User } from '../users/entities/user.entity';

interface UpdateOrgPayload {
  username?: string;
  email?: string;
  password?: string;
  address?: string;
  description?: string;
  contact_number?: string;
  profile_picture_url?: string;
}

interface CreateVerificationRegistrationDto {
  organizationName: string;
  authorizedPersonName: string;
  description: string;
  address: string;
  supporting_documents: string[];
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

  async createVerificationRegistration(dto: CreateVerificationRegistrationDto) {
    const id = await generateCustomId(this.regRepo, 'REG');

    const newReg = this.regRepo.create({
      id,
      organizationName: dto.organizationName,
      authorizedPersonName: String(dto.authorizedPersonName).trim(),
      description: dto.description,
      address: dto.address,
      supporting_documents: dto.supporting_documents,
      submission_time: new Date(),
      status: 'pending',
    });

    return await this.regRepo.save(newReg);
  }

  async createRegistration(dto: CreateOrganizationRegistrationDto) {
    const id = await generateCustomId(this.regRepo, 'REG');

    const newReg = this.regRepo.create({
      id,
      organizationName: dto.organizationName,
      description: dto.description,
      address: dto.address,
      authorizedPersonName: String(dto.authorizedPersonName).trim(),
      supporting_documents: dto.supporting_documents || [],
      submission_time: new Date(),
      status: 'pending',
    });

    return await this.regRepo.save(newReg);
  }

  async findAllPendingRegistrations() {
    const records = await this.regRepo.find({
      where: { status: 'pending' },
      order: { submission_time: 'DESC' },
    });

    return records.map((rec) => {
      if (rec.authorizedPersonName?.includes('|')) {
        rec.authorizedPersonName = rec.authorizedPersonName.split('|')[0];
      }
      return rec;
    });
  }

  async findAllRegistrations() {
    const records = await this.regRepo.find();
    return records.map((rec) => {
      if (rec.authorizedPersonName?.includes('|')) {
        rec.authorizedPersonName = rec.authorizedPersonName.split('|')[0];
      }
      return rec;
    });
  }

  // ─── FIXED: DUAL-PATH FALLBACK LOOKS UP USER REF KEYS NATIVELY ───
  async findOneRegistration(id: string) {
    // 1. Attempt standard primary key search matching direct registration row IDs (REGxxx)
    let reg = await this.regRepo.findOne({ where: { id } });

    // 2. If missing, scan data tables to capture user relation suffix tags (Oxxx)
    if (!reg) {
      const allRecords = await this.regRepo.find();
      reg =
        allRecords.find((rec) =>
          rec.authorizedPersonName?.includes(`|${id}`),
        ) || null;
    }

    if (!reg) {
      throw new NotFoundException(
        `Registration record referencing key "${id}" not found`,
      );
    }

    // Return object instance preserving trailing pipes so frontends can process verification checks
    return reg;
  }

  // ─── REWRITTEN FOR HIGH CONCURRENCY ISOLATED DISK COMMITS ───
  async updateRegistration(
    id: string,
    updateDto: UpdateOrganizationRegistrationDto,
  ) {
    console.log(
      `[APPROVAL PROCESS START] Updating registration record row ID: ${id}`,
      updateDto,
    );

    const registration = await this.regRepo.findOne({ where: { id } });
    if (!registration)
      throw new NotFoundException(`Registration ${id} not found`);

    // ─── CRITICAL FIX: PREVENT OVERWRITING THE HIDDEN PIPE VALUE ───
    // Isolate status modifications exclusively to keep clean incoming names from erasing metadata tracking parameters
    await this.regRepo.update(id, { status: updateDto.status });

    const updatedReg = await this.regRepo.findOne({ where: { id } });
    if (!updatedReg)
      throw new NotFoundException(`Updated registration ${id} not found`);

    console.log(
      `[APPROVAL CHECK] Fresh DB String Target state reads: "${updatedReg.authorizedPersonName}"`,
    );

    if (
      updateDto.status === 'approved' &&
      updatedReg.authorizedPersonName?.includes('|')
    ) {
      const [, targetUserId] = updatedReg.authorizedPersonName.split('|');
      console.log(
        `[APPROVAL MATCH FOUND] Parsing target user key identifier: "${targetUserId}"`,
      );

      if (targetUserId) {
        const existingOrg = await this.orgRepo.findOne({
          where: { user: { id: targetUserId } },
        });

        if (!existingOrg) {
          const orgId = await generateCustomId(this.orgRepo, 'O');

          // Hand TypeORM complete, lightweight entity mapping stubs to resolve internal foreign keys
          const newOrgProfile = this.orgRepo.create({
            id: orgId,
            description: updatedReg.description || 'No description provided',
            profile_picture_url: '/images/default_profile_pic.png',
            contact_number: 'N/A',
            rating: 0,
            registrationRecord: {
              id: updatedReg.id,
            } as OrganizationRegistration,
            user: { id: targetUserId } as User,
          });

          const savedProfile = await this.orgRepo.save(newOrgProfile);
          console.log(
            `[SEED PROFILE SUCCESS ✅] Generated custom row in Organization profile context! ID: ${savedProfile.id}`,
          );
        } else {
          console.log(
            `[SEED SKIPPED ⚠️] Profile row configuration already exists for user link ID: ${targetUserId}`,
          );
        }
      } else {
        console.error(
          `[SEED ERROR ❌] String token extraction split array index failure. targetUserId was blank.`,
        );
      }
    } else {
      console.log(
        `[SEED SKIPPED ⚠️] Core criteria bypassed. Status: "${updateDto.status}", String contains pipe: ${updatedReg.authorizedPersonName?.includes('|')}`,
      );
    }

    if (updatedReg.authorizedPersonName?.includes('|')) {
      updatedReg.authorizedPersonName =
        updatedReg.authorizedPersonName.split('|')[0];
    }

    return updatedReg;
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
      description: dto.description,
      profile_picture_url: dto.profile_picture_url,
      contact_number: dto.contact_number,
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

  async update(id: string, updateDto: UpdateOrgPayload) {
    const org = await this.orgRepo.findOne({
      where: { id },
      relations: ['registrationRecord', 'user'],
    });

    if (!org) throw new NotFoundException('Organization not found');

    const userData: Partial<User> = {};
    if (updateDto.username) userData.username = updateDto.username;
    if (updateDto.email) userData.email = updateDto.email;
    if (updateDto.password) userData.password = updateDto.password;

    if (Object.keys(userData).length > 0 && org.user) {
      await this.orgRepo.manager.update(User, org.user.id, userData);
    }

    if (updateDto.address && org.registrationRecord) {
      await this.regRepo.update(org.registrationRecord.id, {
        address: updateDto.address,
      });
    }

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
