import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsEnum,
  MinLength,
  IsOptional,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password is too short (min 8 characters)' })
  password!: string;

  @IsEnum(['admin', 'volunteer', 'organization'])
  @IsOptional()
  role?: string;
}

export class CreateAdminDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;
}
