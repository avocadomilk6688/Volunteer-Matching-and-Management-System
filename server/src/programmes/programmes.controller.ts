import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ProgrammesService, FilterProgrammeParams } from './programmes.service';
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
  async findAll(@Query() filterDto: FilterProgrammeParams) {
    return await this.programmesService.findAll(filterDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
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
