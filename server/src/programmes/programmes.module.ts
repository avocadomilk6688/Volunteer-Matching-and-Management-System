import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgrammesService } from './programmes.service';
import { ProgrammesController } from './programmes.controller';
import { Programme } from './entities/programme.entity';
import { Schedule } from './entities/schedule.entity';
import { Volunteer } from '../volunteers/entities/volunteer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Programme, Schedule, Volunteer])],
  controllers: [ProgrammesController],
  providers: [ProgrammesService],
})
export class ProgrammesModule {}
