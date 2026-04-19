import { IsNotEmpty, IsString } from 'class-validator';

export class CreateApplicationDto {
  @IsString()
  @IsNotEmpty()
  volunteerId!: string;

  @IsString()
  @IsNotEmpty()
  programmeId!: string;
}
