import { Module } from '@nestjs/common';
import { VolunteersService } from './volunteers.service';
import { VolunteersController } from './volunteers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Volunteer } from './entities/volunteer.entity';
import { Skill } from './entities/skill.entity';
import { Interest } from './entities/interest.entity';
import { VolunteerMonthlyPoint } from './entities/volunteer-monthly-point.entity';
import { Application } from '../applications/entities/application.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Volunteer,
      Skill,
      Interest,
      VolunteerMonthlyPoint,
      Application,
    ]),
  ],
  controllers: [VolunteersController],
  providers: [VolunteersService],
  exports: [VolunteersService],
})
export class VolunteersModule {}
