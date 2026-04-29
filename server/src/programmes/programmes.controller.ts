import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ProgrammesService } from './programmes.service';
import { CreateProgrammeDto } from './dto/create-programme.dto';
import { UpdateProgrammeDto } from './dto/update-programme.dto';

@Controller('programmes')
export class ProgrammesController {
  constructor(private readonly programmesService: ProgrammesService) {}

  @Post()
  async create(@Body() createProgrammeDto: CreateProgrammeDto) {
    return await this.programmesService.create(createProgrammeDto);
  }

  @Get()
  async findAll() {
    return await this.programmesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    // This endpoint is critical for loading specific data
    // into your ProgrammeDetailsPage.tsx
    return await this.programmesService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateProgrammeDto) {
    return await this.programmesService.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.programmesService.remove(id);
  }
}
