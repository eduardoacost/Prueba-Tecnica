import { Role } from '../../generated/prisma/client';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(3)
  password!: string;

  @IsString()
  name!: string;

  @IsEnum(Role)
  role!: Role;

  @IsOptional()
  @IsString()
  specialty?: string;

  @IsOptional()
  @IsString()
  license?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;
}