import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Volunteer } from './entities/volunteer.entity';
import { Skill } from './entities/skill.entity';
import { Interest } from './entities/interest.entity';
import { generateCustomId } from '../common/utils/id_generator.util';

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

  async createSkill(name: string) {
    const id = await generateCustomId(this.skillRepo, 'S');
    const newSkill = this.skillRepo.create({ id, skill_name: name });
    return await this.skillRepo.save(newSkill);
  }

  async createInterest(name: string) {
    const id = await generateCustomId(this.interestRepo, 'I');
    const newInterest = this.interestRepo.create({ id, interest_name: name });
    return await this.interestRepo.save(newInterest);
  }

  async findOne(id: string) {
    return await this.volRepo.findOne({
      where: { id: id as unknown as string } as FindOptionsWhere<Volunteer>,
      relations: ['user', 'skills', 'interests', 'programmes'],
    });
  }

  async findAllSkills() {
    return await this.skillRepo.find({ relations: ['volunteers'] });
  }

  async findAllInterests() {
    return await this.interestRepo.find({ relations: ['volunteers'] });
  }

  async findAll() {
    return await this.volRepo.find({
      relations: ['user', 'skills', 'interests'],
    });
  }

  async update(id: string, updateDto: any) {
    await this.volRepo.update(id, updateDto);
    return this.findOne(id);
  }

  async remove(id: string) {
    const result = await this.volRepo.delete(id);
    return { deleted: (result.affected ?? 0) > 0 };
  }
}
