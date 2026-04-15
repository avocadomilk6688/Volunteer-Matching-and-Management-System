import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
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
    const schId = await generateCustomId(this.scheduleRepo, 'SCH');
    const newSchedule = this.scheduleRepo.create({
      id: schId,
      start_time: new Date(dto.start_time),
      end_time: new Date(dto.end_time),
    });
    const savedSchedule = await this.scheduleRepo.save(newSchedule);

    const pId = await generateCustomId(this.programmeRepo, 'P');
    const newProgramme = this.programmeRepo.create({
      id: pId,
      title: dto.title,
      description: dto.description,
      schedule: savedSchedule,
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
        'related_skills',
        'related_interests',
      ],
    });
  }

  async findOne(id: string) {
    return await this.programmeRepo.findOne({
      where: { id: id as unknown as string } as FindOptionsWhere<Programme>,
      relations: [
        'schedule',
        'organization',
        'related_skills',
        'related_interests',
      ],
    });
  }

  async update(id: string, updateDto: UpdateProgrammeDto) {
    const updateData = updateDto as unknown as Partial<Programme>;
    await this.programmeRepo.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: string) {
    const result = await this.programmeRepo.delete(id);
    return { deleted: (result.affected ?? 0) > 0 };
  }
}
