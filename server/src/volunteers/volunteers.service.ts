import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Volunteer } from './entities/volunteer.entity';
import { Skill } from './entities/skill.entity';
import { Interest } from './entities/interest.entity';
import { generateCustomId } from '../common/utils/id_generator.util';

/**
 * 1. Interfaces for Type Safety
 */
interface IRegistrationRecord {
  name: string;
}

// Local interface to bypass global Express.Multer.File namespace issues
interface LocalMulterFile {
  filename: string;
  path?: string;
  mimetype?: string;
  size?: number;
}

interface UpdateProfileDto {
  username?: string;
  gender?: string;
  location?: string;
  contact_number?: string;
  skills?: string | Skill[];
  interests?: string | Interest[];
}

@Injectable()
export class VolunteersService {
  constructor(
    @InjectRepository(Volunteer)
    private readonly volRepo: Repository<Volunteer>,

    @InjectRepository(Skill)
    private readonly skillRepo: Repository<Skill>,

    @InjectRepository(Interest)
    private readonly interestRepo: Repository<Interest>,
  ) {}

  /**
   * Basic Queries
   */
  async getLeaderboard(): Promise<Volunteer[]> {
    return await this.volRepo.find({
      relations: ['user'],
      order: { points: 'DESC' },
      take: 10,
    });
  }

  async findOne(id: string): Promise<Volunteer | null> {
    return await this.volRepo.findOne({
      where: { id },
      relations: ['user', 'skills', 'interests'],
    });
  }

  async findAll(): Promise<Volunteer[]> {
    return await this.volRepo.find({
      relations: ['user', 'skills', 'interests'],
    });
  }

  /**
   * Skill & Interest Management
   */
  async findAllSkills(): Promise<Skill[]> {
    return await this.skillRepo.find();
  }

  async findAllInterests(): Promise<Interest[]> {
    return await this.interestRepo.find();
  }

  async createSkill(name: string): Promise<Skill> {
    const id = await generateCustomId(this.skillRepo, 'S');
    const newSkill = this.skillRepo.create({ id, skill_name: name });
    return await this.skillRepo.save(newSkill);
  }

  async createInterest(name: string): Promise<Interest> {
    const id = await generateCustomId(this.interestRepo, 'I');
    const newInterest = this.interestRepo.create({ id, interest_name: name });
    return await this.interestRepo.save(newInterest);
  }

  async updateSkill(id: string, newName: string) {
    await this.skillRepo.update(id, { skill_name: newName });
    return { message: `Skill ${id} updated to ${newName}` };
  }

  async updateInterest(id: string, newName: string) {
    await this.interestRepo.update(id, { interest_name: newName });
    return { message: `Interest ${id} updated to ${newName}` };
  }

  /**
   * THE UPDATE METHOD:
   * Handles Multipart/FormData, File Uploads, and Many-to-Many Sync
   */
  async update(
    id: string,
    updateDto: UpdateProfileDto,
    files?: {
      profile_picture?: LocalMulterFile[];
      resume?: LocalMulterFile[];
    },
  ): Promise<Volunteer | null> {
    const volunteer = await this.volRepo.findOne({
      where: { id },
      relations: ['user', 'skills', 'interests'],
    });

    if (!volunteer) return null;

    // 1. Text Fields
    if (updateDto.gender) volunteer.gender = updateDto.gender;
    if (updateDto.location) volunteer.location = updateDto.location;
    if (updateDto.contact_number)
      volunteer.contact_number = updateDto.contact_number;

    // Update username in linked User entity
    if (updateDto.username && volunteer.user) {
      volunteer.user.username = updateDto.username;
    }

    // 2. Many-to-Many Logic (Parsing JSON strings from FormData)
    if (updateDto.skills) {
      volunteer.skills =
        typeof updateDto.skills === 'string'
          ? (JSON.parse(updateDto.skills) as Skill[])
          : updateDto.skills;
    }

    if (updateDto.interests) {
      volunteer.interests =
        typeof updateDto.interests === 'string'
          ? (JSON.parse(updateDto.interests) as Interest[])
          : updateDto.interests;
    }

    // 3. Safe File Handling (Using Type Guarding)
    if (files?.profile_picture && files.profile_picture.length > 0) {
      const profileFile = files.profile_picture[0];
      if (profileFile && 'filename' in profileFile) {
        volunteer.profile_picture_url = `/uploads/avatars/${profileFile.filename}`;
      }
    }

    if (files?.resume && files.resume.length > 0) {
      const resumeFile = files.resume[0];
      if (resumeFile && 'filename' in resumeFile) {
        volunteer.resume_url = `/uploads/resumes/${resumeFile.filename}`;
      }
    }

    return await this.volRepo.save(volunteer);
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    const result = await this.volRepo.delete(id);
    return { deleted: (result.affected ?? 0) > 0 };
  }

  /**
   * Volunteer History Logic
   */
  async getHistory(id: string) {
    const volunteer = await this.volRepo.findOne({
      where: { id },
      relations: [
        'applications',
        'applications.programme',
        'applications.programme.organization',
        'applications.programme.organization.registrationRecord',
        'applications.programme.schedule',
      ],
    });

    if (!volunteer) return null;

    const totalHours: number = (volunteer.applications || [])
      .filter((app) => app.status?.toLowerCase() === 'completed')
      .reduce((sum: number, app): number => {
        const sched = app.programme?.schedule;
        if (sched?.start_time && sched?.end_time) {
          const start = new Date(sched.start_time).getTime();
          const end = new Date(sched.end_time).getTime();
          const diffHours = (end - start) / (1000 * 60 * 60);
          return sum + Math.max(0, diffHours);
        }
        return sum;
      }, 0);

    const history = (volunteer.applications || []).map((app) => {
      const prog = app.programme;
      const sched = prog?.schedule;
      const org = prog?.organization;
      const regRecord = org?.registrationRecord as unknown as
        | IRegistrationRecord
        | undefined;

      let durationStr = '-';
      if (
        sched?.start_time &&
        sched?.end_time &&
        app.status?.toLowerCase() === 'completed'
      ) {
        const diff =
          (new Date(sched.end_time).getTime() -
            new Date(sched.start_time).getTime()) /
          (1000 * 60 * 60);
        durationStr = `${diff.toFixed(1)}h`;
      }

      return {
        id: app.id,
        programme: prog?.title || 'Unknown Programme',
        org: regRecord?.name || 'Unknown Organization',
        schedule: sched?.start_time
          ? new Date(sched.start_time).toLocaleString('en-GB', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : 'No date set',
        hours: durationStr,
        status: app.status || 'Pending',
      };
    });

    return {
      rating: Number(volunteer.rating) || 0,
      totalHours: parseFloat(totalHours.toFixed(1)),
      history,
    };
  }
}
