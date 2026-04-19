import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application } from './entities/application.entity';
import { Volunteer } from '../volunteers/entities/volunteer.entity';
import { Programme } from '../programmes/entities/programme.entity';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { generateCustomId } from '../common/utils/id_generator.util';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application)
    private readonly appRepo: Repository<Application>,
  ) {}

  async applyToProgramme(dto: { volunteerId: string; programmeId: string }) {
    const id = await generateCustomId(this.appRepo, 'APP');

    const newApplication = this.appRepo.create({
      id,
      volunteer: { id: dto.volunteerId } as Volunteer,
      programme: { id: dto.programmeId } as Programme,
      applied_at: new Date(),
      status: 'pending',
    });

    return await this.appRepo.save(newApplication);
  }

  async create(createApplicationDto: CreateApplicationDto) {
    return await this.applyToProgramme({
      volunteerId: createApplicationDto.volunteerId,
      programmeId: createApplicationDto.programmeId,
    });
  }

  async findAll() {
    return await this.appRepo.find({
      relations: ['volunteer', 'programme'],
    });
  }

  async findOne(id: string) {
    return await this.appRepo.findOne({
      where: { id },
      relations: ['volunteer', 'programme'],
    });
  }

  async update(id: string, updateApplicationDto: UpdateApplicationDto) {
    await this.appRepo.update(id, updateApplicationDto);
    return await this.findOne(id);
  }

  async remove(id: string) {
    const result = await this.appRepo.delete(id);
    return { deleted: (result.affected ?? 0) > 0 };
  }
}
