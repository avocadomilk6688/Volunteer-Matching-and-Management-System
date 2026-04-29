import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  async getLeaderboard(): Promise<Volunteer[]> {
    const result: Volunteer[] = await this.volRepo.find({
      relations: ['user'],
      order: {
        points: 'DESC',
      },
      take: 10,
    });
    return result;
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

  // Helper methods for skill/interest updates
  async updateSkill(id: string, newName: string) {
    await this.skillRepo.update(id, { skill_name: newName });
    return { message: `Skill ${id} updated to ${newName}` };
  }

  async updateInterest(id: string, newName: string) {
    await this.interestRepo.update(id, { interest_name: newName });
    return { message: `Interest ${id} updated to ${newName}` };
  }
}
