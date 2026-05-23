import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { maxJobDescriptionTextLength } from '../../cvs/dto/match-cv.dto';

export const maxJobTargetTitleLength = 160;
export const maxJobTargetCompanyNameLength = 160;

const trimString = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateJobTargetDto {
  @Transform(trimString)
  @IsString({ message: 'title is required' })
  @IsNotEmpty({ message: 'title is required' })
  @MaxLength(maxJobTargetTitleLength)
  title!: string;

  @Transform(trimString)
  @IsString({ message: 'companyName is required' })
  @IsNotEmpty({ message: 'companyName is required' })
  @MaxLength(maxJobTargetCompanyNameLength)
  companyName!: string;

  @Transform(trimString)
  @IsString({ message: 'jobDescriptionText is required' })
  @IsNotEmpty({ message: 'jobDescriptionText is required' })
  @MaxLength(maxJobDescriptionTextLength)
  jobDescriptionText!: string;
}
