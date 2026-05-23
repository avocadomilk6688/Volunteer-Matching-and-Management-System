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

    // --- FIXED: Added distinct branches for 'saved' versus 'not-saved' parameters ---
    if (userId) {
      if (saved === 'saved') {
        query.andWhere('savedByUsers.id = :userId', { userId });
      } else if (saved === 'not-saved') {
        // Generates an isolated subquery tracking all elements saved by the authenticated session
        const savedSubQuery = this.programmeRepo
          .createQueryBuilder('subProg')
          .select('subProg.id')
          .leftJoin('subProg.saved_by', 'subSavedBy')
          .where('subSavedBy.id = :userId', { userId });

        // Excludes all corresponding entries using a clean sql NOT IN block statement
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

  async getRecommended(
    userId: string | null,
    filterDto: FilterProgrammeParams,
  ) {
    return this.findAll(filterDto);
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
