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

export interface SaveToggleResponse {
  isSaved: boolean;
  message: string;
}

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

interface RawSkillStat {
  skillId: string;
  participationCount: string | number;
  totalHours: string | number;
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
   * HELPER: Safely parses IDs from FormData (JSON strings) into string arrays.
   */
  private parseIds(ids: string | string[] | undefined): string[] {
    if (!ids) return [];
    if (typeof ids === 'string') {
      try {
        const parsed = JSON.parse(ids) as string[];
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [ids];
      }
    }
    return ids;
  }

  async create(dto: CreateProgrammeDto, imageUrl: string) {
    const pId = await generateCustomId(this.programmeRepo, 'P');
    const schId = await generateCustomId(this.scheduleRepo, 'P');

    const skillIds = this.parseIds(dto.skillIds);
    const interestIds = this.parseIds(dto.interestIds);

    const newProgramme = this.programmeRepo.create({
      id: pId,
      title: dto.title,
      description: dto.description,
      imageUrl: imageUrl,
      schedule: {
        id: schId,
        start_time: new Date(dto.start_time),
        end_time: new Date(dto.end_time),
        mode: dto.mode || 'Physical',
        location: dto.location,
      },
      organization: { id: dto.organizationId } as Organization,
      related_skills: skillIds.map((id: string) => ({ id }) as Skill),
      related_interests: interestIds.map((id: string) => ({ id }) as Interest),
    });

    return await this.programmeRepo.save(newProgramme);
  }

  /**
   * Main paginated list method with filters for volunteer and marketplace feeds
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

    if (userId) {
      if (saved === 'saved') {
        query.andWhere('savedByUsers.id = :userId', { userId });
      } else if (saved === 'not-saved') {
        const savedSubQuery = this.programmeRepo
          .createQueryBuilder('subProg')
          .select('subProg.id')
          .leftJoin('subProg.saved_by', 'subSavedBy')
          .where('subSavedBy.id = :userId', { userId });

        query.andWhere(`programme.id NOT IN (${savedSubQuery.getQuery()})`, {
          userId,
        });
      }
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
   * Explicit unpaginated admin channel
   */
  async findAllAdmin(): Promise<Programme[]> {
    return await this.programmeRepo.find({
      relations: ['schedule', 'organization', 'organization.user'],
      order: { id: 'DESC' },
    });
  }

  /**
   * --- SMART MATCH HYBRID RECOMMENDATION PIPELINE ---
   * Safe from only_full_group_by restrictions, handles history behavior dynamically.
   */
  async getRecommended(
    userId: string | null,
    filterDto: FilterProgrammeParams,
  ) {
    const page = Number(filterDto.page) || 1;
    const limit = Number(filterDto.limit) || 6;
    const skip = (page - 1) * limit;

    const isGuest = !userId || userId === 'guest';

    const volunteer = !isGuest
      ? await this.volunteerRepo.findOne({
          where: { user: { id: userId } },
          relations: ['skills', 'interests'],
        })
      : null;

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
        [volunteer.id],
      );

      skillStats.forEach((s) => {
        statsMap.set(s.skillId, {
          count:
            typeof s.participationCount === 'string'
              ? parseFloat(s.participationCount)
              : s.participationCount || 0,
          hours:
            typeof s.totalHours === 'string'
              ? parseFloat(s.totalHours)
              : s.totalHours || 0,
        });
      });
    }

    // --- CRITICAL FIX: Changed to clean 'leftJoin' for many-to-many properties
    // to shield them completely out of hidden SELECT grouping validations
    const query = this.programmeRepo
      .createQueryBuilder('programme')
      .leftJoinAndSelect('programme.schedule', 'schedule')
      .leftJoinAndSelect('programme.organization', 'organization')
      .leftJoinAndSelect('organization.user', 'user')
      .leftJoin('programme.saved_by', 'savedByUsers');

    // SCORING ALGORITHM BASELINE
    let scoreSql = `(COALESCE(organization.rating, 0) * 5) + 
                    (CASE WHEN schedule.location LIKE :userLoc THEN 35 ELSE 0 END)`;

    if (volunteer?.skills && volunteer.skills.length > 0) {
      volunteer.skills.forEach((skill, index) => {
        const sId = `skill_${index}`;
        const stats = statsMap.get(skill.id) || { count: 0, hours: 0 };
        const boost = stats.count * 5 + stats.hours * 0.5 + 10;

        scoreSql += ` + (CASE WHEN EXISTS (
            SELECT 1 FROM programme_skills psk 
            WHERE psk.programmeId = programme.id AND psk.skillId = :${sId}
        ) THEN ${boost} ELSE 0 END)`;

        query.setParameter(sId, skill.id);
      });
    }

    if (volunteer?.interests && volunteer.interests.length > 0) {
      volunteer.interests.forEach((interest, index) => {
        const iId = `interest_${index}`;
        scoreSql += ` + (CASE WHEN EXISTS (
            SELECT 1 FROM programme_interests pin 
            WHERE pin.programmeId = programme.id AND pin.interestId = :${iId}
        ) THEN 15 ELSE 0 END)`;

        query.setParameter(iId, interest.id);
      });
    }

    query.addSelect(scoreSql, 'relevance_score');
    query.setParameter('userLoc', `%${filterDto.location || ''}%`);

    // Manual Filters Layer
    if (filterDto.keyword) {
      query.andWhere(
        '(programme.title LIKE :keyword OR programme.description LIKE :keyword)',
        { keyword: `%${filterDto.keyword}%` },
      );
    }

    if (filterDto.location) {
      const locations = filterDto.location.split(',');
      query.andWhere(
        new Brackets((qb) => {
          locations.forEach((loc, index) => {
            const paramName = `filter_loc_${index}`;
            qb.orWhere(`schedule.location LIKE :${paramName}`, {
              [paramName]: `%${loc.trim()}%`,
            });
          });
        }),
      );
    }

    if (filterDto.start) {
      query.andWhere('schedule.start_time >= :start', {
        start: new Date(filterDto.start),
      });
    }
    if (filterDto.end) {
      query.andWhere('schedule.end_time <= :end', {
        end: new Date(filterDto.end),
      });
    }

    // Handles intentional search input parameters safely via independent isolation leftJoins
    if (filterDto.skill) {
      const skillIds = filterDto.skill.split(',');
      query
        .leftJoin('programme.related_skills', 'filter_skills')
        .andWhere('filter_skills.id IN (:...skillIds)', { skillIds });
    }

    if (filterDto.interest) {
      const interestIds = filterDto.interest.split(',');
      query
        .leftJoin('programme.related_interests', 'filter_interests')
        .andWhere('filter_interests.id IN (:...interestIds)', { interestIds });
    }

    if (filterDto.userId && filterDto.saved) {
      if (filterDto.saved === 'saved') {
        query.andWhere('savedByUsers.id = :userId', {
          userId: filterDto.userId,
        });
      } else if (filterDto.saved === 'not-saved') {
        const savedSubQuery = this.programmeRepo
          .createQueryBuilder('subProg')
          .select('subProg.id')
          .leftJoin('subProg.saved_by', 'subSavedBy')
          .where('subSavedBy.id = :userId', { userId: filterDto.userId });

        query.andWhere(`programme.id NOT IN (${savedSubQuery.getQuery()})`, {
          userId: filterDto.userId,
        });
      }
    }

    // Explicit valid grouping constraints satisfy SQL mode standards precisely
    query
      .groupBy('programme.id')
      .addGroupBy('schedule.id')
      .addGroupBy('organization.id')
      .addGroupBy('user.id');

    query
      .orderBy('relevance_score', 'DESC')
      .addOrderBy('programme.id', 'ASC')
      .skip(skip)
      .take(limit);

    const [items, total] = await query.getManyAndCount();

    // SECOND PASS MAPPING LOAD ENGINE:
    // If records exist, side-load relationship properties cleanly without clashing with the math aggregates!
    if (items.length > 0) {
      const itemIds = items.map((i) => i.id);
      const fullRelationsData = await this.programmeRepo
        .createQueryBuilder('programme')
        .leftJoinAndSelect('programme.related_skills', 'skills')
        .leftJoinAndSelect('programme.related_interests', 'interests')
        .where('programme.id IN (:...itemIds)', { itemIds })
        .getMany();

      items.forEach((item) => {
        const matchingRow = fullRelationsData.find((r) => r.id === item.id);
        if (matchingRow) {
          item.related_skills = matchingRow.related_skills;
          item.related_interests = matchingRow.related_interests;
        }
      });
    }

    return { items, total, page, lastPage: Math.ceil(total / limit) };
  }

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
      message: !isAlreadySaved ? 'Saved' : 'Unsaved',
    };
  }

  async update(id: string, updateDto: UpdateProgrammeDto) {
    const programme = await this.findOne(id);
    const skillIds = this.parseIds(updateDto.skillIds);
    const interestIds = this.parseIds(updateDto.interestIds);

    const updatedProgramme = this.programmeRepo.merge(programme, {
      ...updateDto,
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
      related_skills: skillIds.map((sId: string) => ({ id: sId }) as Skill),
      related_interests: interestIds.map(
        (iId: string) => ({ id: iId }) as Interest,
      ),
    });
    return await this.programmeRepo.save(updatedProgramme);
  }

  async remove(id: string) {
    const result = await this.programmeRepo.delete(id);
    return { deleted: (result.affected ?? 0) > 0 };
  }
}
