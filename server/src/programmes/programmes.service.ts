import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Programme } from './entities/programme.entity';
import { Schedule } from './entities/schedule.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { Skill } from '../volunteers/entities/skill.entity';
import { Interest } from '../volunteers/entities/interest.entity';
import { CreateProgrammeDto } from './dto/create-programme.dto';
import { UpdateProgrammeDto } from './dto/update-programme.dto';
import { generateCustomId } from '../common/utils/id_generator.util';

export class FilterProgrammeParams {
  keyword?: string;
  location?: string;
  skill?: string;
  interest?: string;
  start?: string;
  end?: string;
  saved?: string;
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
  ) {}

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
   * FULL IMPLEMENTATION: Filtering + Server-Side Pagination
   */
  async findAll(filterDto: FilterProgrammeParams = {}) {
    const { keyword, location, skill, interest, start, end } = filterDto;

    // 1. Setup Pagination values (Default to Page 1, 6 items per page)
    const page = Number(filterDto.page) || 1;
    const limit = Number(filterDto.limit) || 6;
    const skip = (page - 1) * limit;

    const query = this.programmeRepo
      .createQueryBuilder('programme')
      .leftJoinAndSelect('programme.schedule', 'schedule')
      .leftJoinAndSelect('programme.organization', 'organization')
      .leftJoinAndSelect('organization.user', 'user')
      .leftJoinAndSelect('programme.related_skills', 'skills')
      .leftJoinAndSelect('programme.related_interests', 'interests');

    // 2. Apply Filters
    if (keyword) {
      query.andWhere(
        '(programme.title LIKE :keyword OR programme.description LIKE :keyword)', // Changed ILIKE to LIKE
        { keyword: `%${keyword}%` },
      );
    }

    if (location) {
      const locations = location.split(',');
      query.andWhere('schedule.location IN (:...locations)', { locations });
    }

    if (skill) {
      const skillIds = skill.split(',');
      query.andWhere('skills.id IN (:...skillIds)', { skillIds });
    }

    if (interest) {
      const interestIds = interest.split(',');
      query.andWhere('interests.id IN (:...interestIds)', { interestIds });
    }

    if (start) {
      query.andWhere('schedule.start_time >= :start', {
        start: new Date(start),
      });
    }
    if (end) {
      query.andWhere('schedule.end_time <= :end', { end: new Date(end) });
    }

    // 3. Apply Pagination & Sorting
    query.orderBy('programme.id', 'DESC').skip(skip).take(limit);

    // 4. Return both the data and the total count (needed for frontend pagination controls)
    const [items, total] = await query.getManyAndCount();

    return {
      items,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
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
      ],
    });

    if (!programme) {
      throw new NotFoundException(`Programme with ID ${id} not found`);
    }
    return programme;
  }

  async update(id: string, updateDto: UpdateProgrammeDto) {
    const programme = await this.findOne(id);
    if (!programme) return null;

    const updatedProgramme = this.programmeRepo.merge(programme, {
      title: updateDto.title,
      description: updateDto.description,
      imageUrl: updateDto.imageUrl,
      schedule:
        updateDto.start_time ||
        updateDto.end_time ||
        updateDto.location ||
        updateDto.mode
          ? {
              ...programme.schedule,
              start_time: updateDto.start_time
                ? new Date(updateDto.start_time)
                : programme.schedule.start_time,
              end_time: updateDto.end_time
                ? new Date(updateDto.end_time)
                : programme.schedule.end_time,
              location: updateDto.location ?? programme.schedule.location,
              mode: updateDto.mode ?? programme.schedule.mode,
            }
          : programme.schedule,
      related_skills: updateDto.skillIds?.map((id) => ({ id }) as Skill),
      related_interests: updateDto.interestIds?.map(
        (id) => ({ id }) as Interest,
      ),
    });

    return await this.programmeRepo.save(updatedProgramme);
  }

  async remove(id: string) {
    const result = await this.programmeRepo.delete(id);
    return { deleted: (result.affected ?? 0) > 0 };
  }
}
