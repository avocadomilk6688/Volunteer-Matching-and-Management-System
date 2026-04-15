import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { Volunteer } from '../volunteers/entities/volunteer.entity'; // Path might vary
import { Admin } from './entities/admin.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Volunteer, Admin])],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
