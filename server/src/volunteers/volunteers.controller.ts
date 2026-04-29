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
    const result: Volunteer[] = await this.volunteersService.getLeaderboard();
    return result;
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

  // --- DYNAMIC ROUTES (Must come last) ---
  @Get()
  findAll() {
    return this.volunteersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.volunteersService.findOne(id);
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
