import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class MatchCvDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'jobDescriptionText is required' })
  @IsNotEmpty({ message: 'jobDescriptionText is required' })
  jobDescriptionText!: string;
}
