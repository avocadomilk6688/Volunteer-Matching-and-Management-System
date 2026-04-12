import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto, CreateAdminDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {}

export class UpdateAdminDto extends PartialType(CreateAdminDto) {}
