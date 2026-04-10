import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { User } from './users/entities/user.entity';
import { VolunteersModule } from './volunteers/volunteers.module';
import { Volunteer } from './volunteers/entities/volunteer.entity';
import { Skill } from './volunteers/entities/skill.entity';
import { Interest } from './volunteers/entities/interest.entity';
import { OrganizationsModule } from './organizations/organizations.module';
import { OrganizationRegistration } from './organizations/entities/organization-registration.entity';
import { Organization } from './organizations/entities/organization.entity';
import { ProgrammesModule } from './programmes/programmes.module';
import { Schedule } from './programmes/entities/schedule.entity';
import { Programme } from './programmes/entities/programme.entity';
import { InteractionsModule } from './interactions/interactions.module';
import { Message } from './interactions/entities/message.entity';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT!),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [
        User,
        Volunteer,
        Skill,
        Interest,
        OrganizationRegistration,
        Organization,
        Schedule,
        Programme,
        Message,
      ],
      synchronize: true,
    }),
    UsersModule,
    VolunteersModule,
    OrganizationsModule,
    ProgrammesModule,
    InteractionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
