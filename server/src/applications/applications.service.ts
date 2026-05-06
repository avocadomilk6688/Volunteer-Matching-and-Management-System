import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application } from './entities/application.entity';
import { Volunteer } from '../volunteers/entities/volunteer.entity';
import { Programme } from '../programmes/entities/programme.entity';
import { Skill } from '../volunteers/entities/skill.entity';
import { Interest } from '../volunteers/entities/interest.entity';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { generateCustomId } from '../common/utils/id_generator.util';

export interface IncomingApplicationDto {
  volunteerId: string;
  programmeId: string;
  skills?: string;
  interests?: string;
}

interface TagJsonItem {
  id: string;
  name?: string;
}

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application)
    private readonly appRepo: Repository<Application>,

    @InjectRepository(Volunteer)
    private readonly volunteerRepo: Repository<Volunteer>,
  ) {}

  async checkStatus(volunteerId: string, programmeId: string) {
    const application = await this.appRepo.findOne({
      where: {
        volunteer: { id: volunteerId },
        programme: { id: programmeId },
      },
    });

    return {
      enrolled: !!application,
      status: application?.status || null,
    };
  }

  async create(dto: IncomingApplicationDto, file?: Express.Multer.File) {
    // 1. SAFETY CHECK: Ensure dto was parsed correctly by the controller
    if (!dto || !dto.volunteerId || !dto.programmeId) {
      throw new BadRequestException(
        'Missing volunteerId or programmeId in request body.',
      );
    }

    const { volunteerId, programmeId } = dto;

    const volunteer = await this.volunteerRepo.findOne({
      where: { id: volunteerId },
      relations: ['skills', 'interests'],
    });

    if (!volunteer) throw new NotFoundException('Volunteer not found');

    // 2. Parse Tags safely
    if (dto.skills && dto.skills !== 'undefined' && dto.skills !== '') {
      try {
        const skillsData = JSON.parse(dto.skills) as TagJsonItem[];
        volunteer.skills = skillsData.map(
          (s: TagJsonItem) => ({ id: s.id }) as Skill,
        );
      } catch (e) {
        console.error('Failed to parse skills JSON', e);
      }
    }

    if (
      dto.interests &&
      dto.interests !== 'undefined' &&
      dto.interests !== ''
    ) {
      try {
        const interestsData = JSON.parse(dto.interests) as TagJsonItem[];
        volunteer.interests = interestsData.map(
          (i: TagJsonItem) => ({ id: i.id }) as Interest,
        );
      } catch (e) {
        console.error('Failed to parse interests JSON', e);
      }
    }

    // 3. Handle Resume
    if (file) {
      volunteer.resume_url = `/uploads/resumes/${file.filename}`;
    }

    await this.volunteerRepo.save(volunteer);

    // 4. Create Application record
    const id = await generateCustomId(this.appRepo, 'APP');
    const newApplication = this.appRepo.create({
      id,
      volunteer: { id: volunteerId } as Volunteer,
      programme: { id: programmeId } as Programme,
      applied_at: new Date(),
      status: 'pending',
    });

    return await this.appRepo.save(newApplication);
  }

  async findAll() {
    return await this.appRepo.find({ relations: ['volunteer', 'programme'] });
  }

  async findOne(id: string) {
    const application = await this.appRepo.findOne({
      where: { id },
      relations: ['volunteer', 'programme'],
    });
    if (!application) throw new NotFoundException('Application not found');
    return application;
  }

  async update(id: string, updateApplicationDto: UpdateApplicationDto) {
    await this.appRepo.update(id, updateApplicationDto);
    return await this.findOne(id);
  }

  async remove(id: string) {
    const result = await this.appRepo.delete(id);
    return { deleted: (result.affected ?? 0) > 0 };
  }
}
