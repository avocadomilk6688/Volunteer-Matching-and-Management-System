import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { Organization } from './entities/organization.entity';
import { OrganizationRegistration } from './entities/organization-registration.entity';
import { User } from '../users/entities/user.entity'; // 👈 Imported user context safely

@Module({
  imports: [
    TypeOrmModule.forFeature([Organization, OrganizationRegistration, User]),
  ],
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
