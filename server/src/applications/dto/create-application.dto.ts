import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateApplicationDto {
  @IsString()
  @IsNotEmpty()
  volunteerId!: string;

  @IsString()
  @IsNotEmpty()
  programmeId!: string;

  @IsString()
  @IsOptional()
  message!: string;
}
