import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from '../users/entities/user.entity';
import { Volunteer } from '../volunteers/entities/volunteer.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { MailModule } from '../mail/mail.module';

// AuthModule bundles the authentication logic, mail utilities, and database dependencies.
@Module({
  imports: [
    TypeOrmModule.forFeature([User, Volunteer, Organization]),
    MailModule,
  ],
  // Registers the controller to handle incoming HTTP requests.
  controllers: [AuthController],
  // Registers the service to handle the business logic and database work.
  providers: [AuthService],
})
export class AuthModule {}
