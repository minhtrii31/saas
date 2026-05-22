import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { maxJobDescriptionTextLength } from './match-cv.dto';

const maxCompanyNameLength = 120;
const maxRoleTitleLength = 120;

export class GenerateCoverLetterDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'jobDescriptionText is required' })
  @IsNotEmpty({ message: 'jobDescriptionText is required' })
  @MaxLength(maxJobDescriptionTextLength)
  jobDescriptionText!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString({ message: 'companyName must be a string' })
  @MaxLength(maxCompanyNameLength)
  companyName?: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString({ message: 'roleTitle must be a string' })
  @MaxLength(maxRoleTitleLength)
  roleTitle?: string;
}
