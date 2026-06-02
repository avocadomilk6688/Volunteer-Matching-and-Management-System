import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsUrl,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateOrganizationRegistrationDto {
  @IsString()
  @IsOptional()
  organizationName?: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  supporting_documents?: string[];

  @IsString()
  @IsNotEmpty()
  authorizedPersonName!: string;

  @IsString()
  @IsOptional()
  address?: string;
}

export class CreateOrganizationDto {
  @IsString()
  @IsOptional()
  description?: string;

  @IsUrl()
  @IsNotEmpty()
  profile_picture_url!: string;

  @IsString()
  @IsNotEmpty()
  contact_number!: string;

  @IsString()
  @IsNotEmpty()
  registrationRecordId!: string;

  @IsString()
  @IsNotEmpty()
  userId!: string;
}

// ─── FIXED: STRICT TYPE VALIDATION HOOK FOR UPDATE STRINGS ───
export class UpdateOrganizationRegistrationDto extends PartialType(
  CreateOrganizationRegistrationDto,
) {
  @IsString()
  @IsOptional()
  status?: string;
}

export class UpdateOrganizationDto extends PartialType(CreateOrganizationDto) {}
