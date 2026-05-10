import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Volunteer } from './entities/volunteer.entity';
import { Skill } from './entities/skill.entity';
import { Interest } from './entities/interest.entity';
import { VolunteerMonthlyPoint } from './entities/volunteer-monthly-point.entity';
import { Application } from '../applications/entities/application.entity';
import { generateCustomId } from '../common/utils/id_generator.util';

/**
 * 1. Change to CLASS to support NestJS Decorator Metadata
 */
export class UpdateProfileDto {
  username?: string;
  gender?: string;
  location?: string;
  contact_number?: string;
  skills?: string | Skill[];
  interests?: string | Interest[];
}

export interface LocalMulterFile {
  filename: string;
}

/**
 * 2. Define an interface for History to avoid "any"
 */
export interface VolunteerHistory {
  rating: number;
  history: {
    id: string;
    status: string | undefined;
    title: string | undefined;
  }[];
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
    @InjectRepository(VolunteerMonthlyPoint)
    private readonly monthlyRepo: Repository<VolunteerMonthlyPoint>,
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
  ) {}

  async getLeaderboard(
    month: number,
    year: number,
  ): Promise<VolunteerMonthlyPoint[]> {
    return await this.monthlyRepo.find({
      where: { month: Number(month), year: Number(year) },
      relations: ['volunteer', 'volunteer.user'],
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

  async update(
    id: string,
    updateDto: UpdateProfileDto,
    files?: {
      profile_picture?: LocalMulterFile[];
      resume?: LocalMulterFile[];
    },
  ): Promise<Volunteer | null> {
    const volunteer = await this.findOne(id);
    if (!volunteer) return null;

    if (updateDto.gender) volunteer.gender = updateDto.gender;
    if (updateDto.location) volunteer.location = updateDto.location;
    if (updateDto.contact_number)
      volunteer.contact_number = updateDto.contact_number;
    if (updateDto.username && volunteer.user)
      volunteer.user.username = updateDto.username;

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

    if (files?.profile_picture?.[0]) {
      volunteer.profile_picture_url = `/uploads/avatars/${files.profile_picture[0].filename}`;
    }

    if (files?.resume?.[0]) {
      volunteer.resume_url = `/uploads/resumes/${files.resume[0].filename}`;
    }

    return await this.volRepo.save(volunteer);
  }

  async completeProgramme(
    applicationId: string,
  ): Promise<VolunteerMonthlyPoint> {
    const app = await this.applicationRepo.findOne({
      where: { id: applicationId },
      relations: ['volunteer', 'programme', 'programme.schedule'],
    });

    if (!app) throw new NotFoundException('Application not found');

    const volunteer = app.volunteer;
    const schedule = app.programme.schedule;
    const diffMs = schedule.end_time.getTime() - schedule.start_time.getTime();
    const hoursWorked = diffMs / (1000 * 60 * 60);
    const pointsEarned = hoursWorked * (Number(volunteer.rating) || 0);

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    let monthlyRecord = await this.monthlyRepo.findOne({
      where: { volunteer: { id: volunteer.id }, month, year },
    });

    if (!monthlyRecord) {
      monthlyRecord = this.monthlyRepo.create({
        volunteer,
        month,
        year,
        totalHours: hoursWorked,
        points: pointsEarned,
      });
    } else {
      monthlyRecord.totalHours += hoursWorked;
      monthlyRecord.points += pointsEarned;
    }

    return await this.monthlyRepo.save(monthlyRecord);
  }

  async getHistory(id: string): Promise<VolunteerHistory | null> {
    const volunteer = await this.volRepo.findOne({
      where: { id },
      relations: [
        'applications',
        'applications.programme',
        'applications.programme.schedule',
      ],
    });
    if (!volunteer) return null;

    return {
      rating: Number(volunteer.rating) || 0,
      history: (volunteer.applications || []).map((app) => ({
        id: app.id,
        status: app.status,
        title: app.programme?.title,
      })),
    };
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    const result = await this.volRepo.delete(id);
    return { deleted: (result.affected ?? 0) > 0 };
  }
}
