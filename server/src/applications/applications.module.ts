import { Module } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { ApplicationsController } from './applications.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Application } from './entities/application.entity';
import { Volunteer } from '../volunteers/entities/volunteer.entity';
import { Skill } from '../volunteers/entities/skill.entity';
import { Interest } from '../volunteers/entities/interest.entity';
import { User } from '../users/entities/user.entity';
import { Notification } from '../interactions/entities/notification.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Application,
      Volunteer,
      Skill,
      Interest,
      Notification,
      User,
    ]),
  ],
  controllers: [ApplicationsController],
  providers: [ApplicationsService],
})
export class ApplicationsModule {}
