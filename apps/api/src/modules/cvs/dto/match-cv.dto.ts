import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export const maxJobDescriptionTextLength = 20000;

export class MatchCvDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'jobDescriptionText is required' })
  @IsNotEmpty({ message: 'jobDescriptionText is required' })
  @MaxLength(maxJobDescriptionTextLength)
  jobDescriptionText!: string;
}
