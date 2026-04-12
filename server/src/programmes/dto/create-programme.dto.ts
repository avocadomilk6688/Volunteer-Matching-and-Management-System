import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsArray,
  IsOptional,
} from 'class-validator';

export class CreateProgrammeDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsString()
  @IsNotEmpty()
  organizationId!: string;

  @IsDateString()
  @IsNotEmpty()
  start_time!: string;

  @IsDateString()
  @IsNotEmpty()
  end_time!: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skillIds?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  interestIds?: string[];
}
