import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApplicationStatus } from '@prisma/client';
import {
  maxApplicationCompanyNameLength,
  maxApplicationNotesLength,
  maxApplicationRoleTitleLength,
} from './create-application.dto';

const trimString = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class UpdateApplicationDto {
  @IsOptional()
  @IsUUID('4', { message: 'cvId must be a UUID' })
  cvId?: string;

  @IsOptional()
  @IsUUID('4', { message: 'jobTargetId must be a UUID' })
  jobTargetId?: string;

  @Transform(trimString)
  @IsOptional()
  @IsString({ message: 'companyName must be a string' })
  @IsNotEmpty({ message: 'companyName is required' })
  @MaxLength(maxApplicationCompanyNameLength)
  companyName?: string;

  @Transform(trimString)
  @IsOptional()
  @IsString({ message: 'roleTitle must be a string' })
  @IsNotEmpty({ message: 'roleTitle is required' })
  @MaxLength(maxApplicationRoleTitleLength)
  roleTitle?: string;

  @IsOptional()
  @IsEnum(ApplicationStatus, {
    message: 'status must be a valid application status',
  })
  status?: ApplicationStatus;

  @IsOptional()
  @IsDateString({}, { message: 'appliedAt must be an ISO date string' })
  appliedAt?: string | null;

  @Transform(trimString)
  @IsOptional()
  @IsString({ message: 'notes must be a string' })
  @MaxLength(maxApplicationNotesLength)
  notes?: string | null;
}
