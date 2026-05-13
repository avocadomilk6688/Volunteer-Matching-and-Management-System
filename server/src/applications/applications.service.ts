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
import { Notification } from '../interactions/entities/notification.entity';
import { generateCustomId } from '../common/utils/id_generator.util';

// --- Interfaces for Type Safety ---
export interface IncomingApplicationDto {
  volunteerId: string;
  programmeId: string;
  skills?: string;
  interests?: string;
}

interface TagJsonItem {
  id: string;
}

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application)
    private readonly appRepo: Repository<Application>,

    @InjectRepository(Volunteer)
    private readonly volunteerRepo: Repository<Volunteer>,

    @InjectRepository(Notification)
    private readonly notifRepo: Repository<Notification>,
  ) {}

  /**
   * Fetch all applications for a specific organization.
   */
  async findAllByOrg(orgId: string): Promise<Application[]> {
    return await this.appRepo.find({
      where: {
        programme: { organization: { id: orgId } },
      },
      relations: [
        'volunteer',
        'volunteer.user',
        'volunteer.skills',
        'volunteer.interests',
        'programme',
      ],
    });
  }

  /**
   * Check if a volunteer is already enrolled in a programme.
   */
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

  /**
   * Create a new application and update volunteer profile.
   */
  async create(dto: IncomingApplicationDto, file?: Express.Multer.File) {
    if (!dto || !dto.volunteerId || !dto.programmeId) {
      throw new BadRequestException('Missing volunteerId or programmeId');
    }

    const { volunteerId, programmeId } = dto;

    const volunteer = await this.volunteerRepo.findOne({
      where: { id: volunteerId },
      relations: ['skills', 'interests'],
    });

    if (!volunteer) throw new NotFoundException('Volunteer not found');

    // 1. Safe parsing of Skills
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

    // 2. Safe parsing of Interests
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

    // 3. Update Resume path
    if (file) {
      volunteer.resume_url = `/uploads/resumes/${file.filename}`;
    }

    await this.volunteerRepo.save(volunteer);

    // 4. Create the Application record
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

  /**
   * Approve or Reject an application and notify the volunteer.
   */
  async updateStatus(id: string, status: 'upcoming' | 'rejected') {
    const application = await this.appRepo.findOne({
      where: { id },
      relations: ['volunteer', 'volunteer.user', 'programme'],
    });

    if (!application) throw new NotFoundException('Application not found');

    application.status = status;
    const savedApp = await this.appRepo.save(application);

    if (application.volunteer?.user) {
      const notifId = await generateCustomId(this.notifRepo, 'NOT');
      const message =
        status === 'upcoming'
          ? `Your application for "${application.programme.title}" has been approved! It is now listed under your upcoming events.`
          : `We regret to inform you that your application for "${application.programme.title}" was not accepted at this time.`;

      const newNotif = this.notifRepo.create();
      newNotif.id = notifId;
      newNotif.content = message;
      newNotif.receiver = application.volunteer.user;

      await this.notifRepo.save(newNotif);
    }

    return savedApp;
  }

  async findAll() {
    return await this.appRepo.find({
      relations: ['volunteer', 'volunteer.user', 'programme'],
    });
  }

  async findOne(id: string) {
    const application = await this.appRepo.findOne({
      where: { id },
      relations: ['volunteer', 'programme'],
    });
    if (!application) throw new NotFoundException('Application not found');
    return application;
  }

  async remove(id: string) {
    const result = await this.appRepo.delete(id);
    return { deleted: (result.affected ?? 0) > 0 };
  }
}
