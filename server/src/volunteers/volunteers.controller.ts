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

@Controller('volunteers')
export class VolunteersController {
  constructor(private readonly volunteersService: VolunteersService) {}

  @Post('skills')
  createSkill(@Body('name') name: string) {
    return this.volunteersService.createSkill(name);
  }

  @Get('skills')
  findAllSkills() {
    return this.volunteersService.findAllSkills();
  }

  @Post('interests')
  createInterest(@Body('name') name: string) {
    return this.volunteersService.createInterest(name);
  }

  @Get('interests')
  findAllInterests() {
    return this.volunteersService.findAllInterests();
  }

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
