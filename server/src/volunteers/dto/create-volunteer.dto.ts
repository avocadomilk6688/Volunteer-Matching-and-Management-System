import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUrl,
  IsArray,
  Length,
} from 'class-validator';

export class CreateVolunteerDto {
  @IsUrl()
  @IsOptional()
  profilePictureUrl?: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 1, { message: 'Gender must be a single character (M/F/O)' })
  gender!: string;

  @IsString()
  @IsNotEmpty()
  contactNumber!: string;

  @IsString()
  @IsNotEmpty()
  location!: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skills?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  interests?: string[];

  @IsString()
  @IsNotEmpty()
  userId!: string;
}
export class CreateSkillDto {
  @IsString()
  @IsNotEmpty()
  skill_name!: string;
}
export class CreateInterestDto {
  @IsString()
  @IsNotEmpty()
  interest_name!: string;
}
