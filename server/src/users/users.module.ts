import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { Volunteer } from '../volunteers/entities/volunteer.entity';
import { Admin } from './entities/admin.entity';
import { Organization } from '../organizations/entities/organization.entity'; // Import this!

@Module({
  imports: [TypeOrmModule.forFeature([User, Volunteer, Admin, Organization])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
