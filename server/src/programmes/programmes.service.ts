import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { Programme } from './entities/programme.entity';
import { Schedule } from './entities/schedule.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { Skill } from '../volunteers/entities/skill.entity';
import { Interest } from '../volunteers/entities/interest.entity';
import { CreateProgrammeDto } from './dto/create-programme.dto';
import { UpdateProgrammeDto } from './dto/update-programme.dto';
import { generateCustomId } from '../common/utils/id_generator.util';
import { Volunteer } from '../volunteers/entities/volunteer.entity';

/**
 * Interface for the Toggle Save response.
 */
export interface SaveToggleResponse {
  isSaved: boolean;
  message: string;
}

/**
 * Interface for raw SQL statistics in recommendation engine.
 */
interface RawSkillStat {
  skillId: string;
  participationCount: string;
  totalHours: string;
}

/**
 * Filter parameters for searching and pagination.
 */
export class FilterProgrammeParams {
  keyword?: string;
  location?: string;
  skill?: string;
  interest?: string;
  start?: string;
  end?: string;
  saved?: string;
  userId?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class ProgrammesService {
  constructor(
    @InjectRepository(Programme)
    private readonly programmeRepo: Repository<Programme>,

    @InjectRepository(Schedule)
    private readonly scheduleRepo: Repository<Schedule>,

    @InjectRepository(Volunteer)
    private readonly volunteerRepo: Repository<Volunteer>,
  ) {}

  /**
   * CREATE: Saves a new programme and automatically creates the associated schedule.
   */
  async create(dto: CreateProgrammeDto) {
    const pId = await generateCustomId(this.programmeRepo, 'P');
    const schId = await generateCustomId(this.scheduleRepo, 'P');

    const newProgramme = this.programmeRepo.create({
      id: pId,
      title: dto.title,
      description: dto.description,
      imageUrl: dto.imageUrl,
      schedule: {
        id: schId,
        start_time: new Date(dto.start_time),
        end_time: new Date(dto.end_time),
        mode: dto.mode || 'Physical',
        location: dto.location,
      },
      organization: { id: dto.organizationId } as Organization,
      related_skills: dto.skillIds?.map((id) => ({ id }) as Skill),
      related_interests: dto.interestIds?.map((id) => ({ id }) as Interest),
    });

    return await this.programmeRepo.save(newProgramme);
  }

  /**
   * FIND ALL: Standard search with filters.
   * (Fallback for basic search requests)
   */
  async findAll(filterDto: FilterProgrammeParams = {}) {
    const { keyword, location, skill, interest, start, end, saved, userId } =
      filterDto;

    const page = Number(filterDto.page) || 1;
    const limit = Number(filterDto.limit) || 6;
    const skip = (page - 1) * limit;

    const query = this.programmeRepo
      .createQueryBuilder('programme')
      .leftJoinAndSelect('programme.schedule', 'schedule')
      .leftJoinAndSelect('programme.organization', 'organization')
      .leftJoinAndSelect('organization.user', 'user')
      .leftJoinAndSelect('programme.related_skills', 'skills')
      .leftJoinAndSelect('programme.related_interests', 'interests')
      .leftJoin('programme.saved_by', 'savedByUsers');

    if (keyword) {
      query.andWhere(
        '(programme.title LIKE :keyword OR programme.description LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    if (location) {
      const locations = location.split(',');
      query.andWhere(
        new Brackets((qb) => {
          locations.forEach((loc, index) => {
            const paramName = `loc_${index}`;
            qb.orWhere(`schedule.location LIKE :${paramName}`, {
              [paramName]: `%${loc.trim()}%`,
            });
          });
        }),
      );
    }

    if (saved === 'saved' && userId) {
      query.andWhere('savedByUsers.id = :userId', { userId });
    }

    if (skill) {
      const skillIds = skill.split(',');
      query.andWhere('skills.id IN (:...skillIds)', { skillIds });
    }

    if (interest) {
      const interestIds = interest.split(',');
      query.andWhere('interests.id IN (:...interestIds)', { interestIds });
    }

    if (start)
      query.andWhere('schedule.start_time >= :start', {
        start: new Date(start),
      });
    if (end)
      query.andWhere('schedule.end_time <= :end', { end: new Date(end) });

    query.orderBy('programme.id', 'DESC').skip(skip).take(limit);

    const [items, total] = await query.getManyAndCount();

    return { items, total, page, lastPage: Math.ceil(total / limit) };
  }

  /**
   * GET RECOMMENDED: The Smart "YouTube-Style" Feed.
   * Handles Guests, Newbies, and Veterans naturally.
   */
  async getRecommended(
    userId: string | null,
    filterDto: FilterProgrammeParams,
  ) {
    const page = Number(filterDto.page) || 1;
    const limit = Number(filterDto.limit) || 6;
    const skip = (page - 1) * limit;

    // 1. Determine User Context
    const isGuest = !userId || userId === 'guest';
    const volunteer = !isGuest
      ? await this.volunteerRepo.findOne({
          where: { id: userId },
          relations: ['skills'],
        })
      : null;

    // 2. Fetch Veteran Stats (Participation + Hours)
    const statsMap = new Map<string, { count: number; hours: number }>();
    if (volunteer) {
      const skillStats: RawSkillStat[] = await this.programmeRepo.query(
        `
          SELECT 
              ps.skillId, 
              COUNT(app.id) AS participationCount, 
              SUM(TIMESTAMPDIFF(HOUR, s.start_time, s.end_time)) AS totalHours
          FROM application app
          JOIN programme p ON app.programmeId = p.id
          JOIN schedule s ON p.scheduleId = s.id 
          JOIN programme_skills ps ON p.id = ps.programmeId
          WHERE app.volunteerId = ? AND app.status = 'completed'
          GROUP BY ps.skillId
      `,
        [userId],
      );

      skillStats.forEach((s) => {
        statsMap.set(s.skillId, {
          count: parseFloat(s.participationCount) || 0,
          hours: parseFloat(s.totalHours) || 0,
        });
      });
    }

    // 3. The Scored Recommendation Query
    const query = this.programmeRepo
      .createQueryBuilder('programme')
      .leftJoinAndSelect('programme.schedule', 'schedule')
      .leftJoinAndSelect('programme.organization', 'organization')
      .leftJoinAndSelect('organization.user', 'user')
      .leftJoin('programme.related_skills', 'p_skills');

    // SCORING FORMULA:
    // Global Quality (Rating * 5) + Location Match (+35 pts)
    let scoreSql = `(COALESCE(organization.rating, 0) * 5) + 
                    (CASE WHEN schedule.location LIKE :userLoc THEN 35 ELSE 0 END)`;

    // Add "Veteran Expertise" points if volunteer has skills
    if (volunteer?.skills) {
      volunteer.skills.forEach((skill, index) => {
        const sId = `skill_${index}`;
        const stats = statsMap.get(skill.id) || { count: 0, hours: 0 };

        // Boost = Participation*5 + Hours*0.5 + BaseMatch*10
        const boost = stats.count * 5 + stats.hours * 0.5 + 10;

        scoreSql += ` + (CASE WHEN EXISTS (
            SELECT 1 FROM programme_skills psk 
            WHERE psk.programmeId = programme.id AND psk.skillId = :${sId}
        ) THEN ${boost} ELSE 0 END)`;

        query.setParameter(sId, skill.id);
      });
    }

    query.addSelect(scoreSql, 'relevance_score');
    query.setParameter('userLoc', `%${volunteer?.location || ''}%`);

    if (filterDto.keyword) {
      query.andWhere('programme.title LIKE :kw', {
        kw: `%${filterDto.keyword}%`,
      });
    }

    query
      .orderBy('relevance_score', 'DESC')
      .addOrderBy('programme.id', 'DESC')
      .skip(skip)
      .take(limit);

    const [items, total] = await query.getManyAndCount();

    return { items, total, page, lastPage: Math.ceil(total / limit) };
  }

  /**
   * FIND ONE: Fetches a single programme with full relationship data.
   */
  async findOne(id: string) {
    const programme = await this.programmeRepo.findOne({
      where: { id },
      relations: [
        'schedule',
        'organization',
        'organization.user',
        'related_skills',
        'related_interests',
        'saved_by',
      ],
    });
    if (!programme)
      throw new NotFoundException(`Programme with ID ${id} not found`);
    return programme;
  }

  /**
   * TOGGLE SAVE: Adds or removes a programme from the volunteer's saved list.
   */
  async toggleSave(
    programmeId: string,
    userId: string,
  ): Promise<SaveToggleResponse> {
    const programme = await this.findOne(programmeId);
    if (!programme.saved_by) programme.saved_by = [];

    const isAlreadySaved = programme.saved_by.some((v) => v.id === userId);

    if (isAlreadySaved) {
      programme.saved_by = programme.saved_by.filter((v) => v.id !== userId);
    } else {
      programme.saved_by.push({ id: userId } as Volunteer);
    }

    await this.programmeRepo.save(programme);
    return {
      isSaved: !isAlreadySaved,
      message: !isAlreadySaved ? 'Saved successfully' : 'Unsaved successfully',
    };
  }

  /**
   * UPDATE: Merges new data into an existing programme and schedule.
   */
  async update(id: string, updateDto: UpdateProgrammeDto) {
    const programme = await this.findOne(id);
    const updatedProgramme = this.programmeRepo.merge(programme, {
      title: updateDto.title,
      description: updateDto.description,
      imageUrl: updateDto.imageUrl,
      schedule: {
        ...programme.schedule,
        start_time: updateDto.start_time
          ? new Date(updateDto.start_time)
          : programme.schedule.start_time,
        end_time: updateDto.end_time
          ? new Date(updateDto.end_time)
          : programme.schedule.end_time,
        location: updateDto.location ?? programme.schedule.location,
        mode: updateDto.mode ?? programme.schedule.mode,
      },
      related_skills: updateDto.skillIds?.map((id) => ({ id }) as Skill),
      related_interests: updateDto.interestIds?.map(
        (id) => ({ id }) as Interest,
      ),
    });
    return await this.programmeRepo.save(updatedProgramme);
  }

  /**
   * REMOVE: Permanently deletes a programme by ID.
   */
  async remove(id: string) {
    const result = await this.programmeRepo.delete(id);
    return { deleted: (result.affected ?? 0) > 0 };
  }
}
