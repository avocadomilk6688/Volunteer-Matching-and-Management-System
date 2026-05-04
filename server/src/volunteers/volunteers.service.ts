import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Volunteer } from './entities/volunteer.entity';
import { Skill } from './entities/skill.entity';
import { Interest } from './entities/interest.entity';
import { generateCustomId } from '../common/utils/id_generator.util';

// 1. Define a local interface to break the circular dependency trap
interface IRegistrationRecord {
  name: string;
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

  async getLeaderboard(): Promise<Volunteer[]> {
    return await this.volRepo.find({
      relations: ['user'],
      order: { points: 'DESC' },
      take: 10,
    });
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

  async update(id: string, updateDto: any): Promise<Volunteer | null> {
    await this.volRepo.update(id, updateDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    const result = await this.volRepo.delete(id);
    return { deleted: (result.affected ?? 0) > 0 };
  }

  async updateSkill(id: string, newName: string) {
    await this.skillRepo.update(id, { skill_name: newName });
    return { message: `Skill ${id} updated to ${newName}` };
  }

  async updateInterest(id: string, newName: string) {
    await this.interestRepo.update(id, { interest_name: newName });
    return { message: `Interest ${id} updated to ${newName}` };
  }

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

      // FIX: Use 'as unknown as' to bridge the gap safely without 'any'
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
        org: regRecord?.name || 'Unknown Organization', // Now linter-safe!
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
