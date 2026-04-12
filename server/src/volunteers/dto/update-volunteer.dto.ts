import { PartialType } from '@nestjs/mapped-types';
import {
  CreateVolunteerDto,
  CreateSkillDto,
  CreateInterestDto,
} from './create-volunteer.dto';

export class UpdateVolunteerDto extends PartialType(CreateVolunteerDto) {}

export class UpdateSkillDto extends PartialType(CreateSkillDto) {}

export class UpdateInterestDto extends PartialType(CreateInterestDto) {}
