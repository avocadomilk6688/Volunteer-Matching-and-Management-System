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

  async findAll() {
    return await this.programmeRepo.find({
      relations: [
        'schedule',
        'organization',
        'organization.user', // Required for organization name in cards
        'related_skills',
        'related_interests',
      ],
    });
  }

  async findOne(id: string) {
    const programme = await this.programmeRepo.findOne({
      where: { id },
      relations: [
        'schedule',
        'organization',
        'organization.user', // Added so username/email works on Details Page
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
