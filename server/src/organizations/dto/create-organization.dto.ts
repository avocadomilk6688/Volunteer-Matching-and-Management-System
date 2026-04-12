import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsUrl,
} from 'class-validator';

export class CreateOrganizationRegistrationDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  submitted_documents!: string[];

  @IsString()
  @IsNotEmpty()
  authorized_person!: string;
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
