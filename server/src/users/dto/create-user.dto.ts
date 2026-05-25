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
  role?: 'admin' | 'volunteer' | 'organization'; // --- CHANGED: Strongly typed string literal union instead of generic string ---

  @IsString()
  @IsOptional()
  contact_number?: string; // --- ADDED: Declared parameter property matching frontend form streams safely ---
}

export class CreateAdminDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;
}
