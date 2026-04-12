import { PartialType } from '@nestjs/mapped-types';
import {
  CreateOrganizationDto,
  CreateOrganizationRegistrationDto,
} from './create-organization.dto';

export class UpdateOrganizationDto extends PartialType(CreateOrganizationDto) {}

export class UpdateOrganizationRegistrationDto extends PartialType(
  CreateOrganizationRegistrationDto,
) {}
