import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from '../users/entities/user.entity';
import { MailModule } from '../mail/mail.module'; // 👈 Imported the new MailModule wrapper

// AuthModule bundles the authentication logic, mail utilities, and database dependencies.
@Module({
  imports: [TypeOrmModule.forFeature([User]), MailModule],
  // Registers the controller to handle incoming HTTP requests.
  controllers: [AuthController],
  // Registers the service to handle the business logic and database work.
  providers: [AuthService],
})
export class AuthModule {}
