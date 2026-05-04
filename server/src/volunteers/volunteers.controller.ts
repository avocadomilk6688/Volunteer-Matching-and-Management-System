import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { VolunteersService } from './volunteers.service';
import { Volunteer } from './entities/volunteer.entity';

@Controller('volunteers')
export class VolunteersController {
  constructor(private readonly volunteersService: VolunteersService) {}

  // --- STATIC ROUTES (Must come before :id) ---
  @Get('leaderboard')
  async getLeaderboard(): Promise<Volunteer[]> {
    return await this.volunteersService.getLeaderboard();
  }

  @Get('skills')
  findAllSkills() {
    return this.volunteersService.findAllSkills();
  }

  @Get('interests')
  findAllInterests() {
    return this.volunteersService.findAllInterests();
  }

  @Post('skills')
  createSkill(@Body('name') name: string) {
    return this.volunteersService.createSkill(name);
  }

  @Post('interests')
  createInterest(@Body('name') name: string) {
    return this.volunteersService.createInterest(name);
  }

  // --- DYNAMIC ROUTES ---
  @Get(':id/history')
  async getHistory(@Param('id') id: string) {
    const historyData = await this.volunteersService.getHistory(id);
    if (!historyData) {
      return {
        message: 'Volunteer history not found',
        history: [],
        totalHours: 0,
        rating: 0,
      };
    }
    return historyData;
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.volunteersService.findOne(id);
  }

  @Get()
  findAll() {
    return this.volunteersService.findAll();
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.volunteersService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.volunteersService.remove(id);
  }
}
