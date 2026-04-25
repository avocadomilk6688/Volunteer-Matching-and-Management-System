import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from '../users/entities/user.entity';

// AuthModule bundles the authentication logic and database dependencies.
@Module({
  // Imports the User entity to allow the repository to be injected into the service.
  imports: [TypeOrmModule.forFeature([User])],
  // Registers the controller to handle incoming HTTP requests.
  controllers: [AuthController],
  // Registers the service to handle the business logic and database work.
  providers: [AuthService],
})
export class AuthModule {}
