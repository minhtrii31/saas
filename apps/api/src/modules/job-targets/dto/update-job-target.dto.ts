import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { maxJobDescriptionTextLength } from '../../cvs/dto/match-cv.dto';
import {
  maxJobTargetCompanyNameLength,
  maxJobTargetTitleLength,
} from './create-job-target.dto';

const trimString = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class UpdateJobTargetDto {
  @Transform(trimString)
  @IsOptional()
  @IsString({ message: 'title must be a string' })
  @IsNotEmpty({ message: 'title is required' })
  @MaxLength(maxJobTargetTitleLength)
  title?: string;

  @Transform(trimString)
  @IsOptional()
  @IsString({ message: 'companyName must be a string' })
  @IsNotEmpty({ message: 'companyName is required' })
  @MaxLength(maxJobTargetCompanyNameLength)
  companyName?: string;

  @Transform(trimString)
  @IsOptional()
  @IsString({ message: 'jobDescriptionText must be a string' })
  @IsNotEmpty({ message: 'jobDescriptionText is required' })
  @MaxLength(maxJobDescriptionTextLength)
  jobDescriptionText?: string;
}
