import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { maxJobDescriptionTextLength } from './match-cv.dto';

export const interviewFocuses = ['behavioral', 'technical', 'mixed'] as const;
export type InterviewFocus = (typeof interviewFocuses)[number];

export class GenerateInterviewPrepDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsUUID(undefined, { message: 'jobTargetId must be a UUID' })
  jobTargetId?: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString({ message: 'jobDescriptionText must be a string' })
  @MaxLength(maxJobDescriptionTextLength)
  jobDescriptionText?: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsIn(interviewFocuses)
  interviewFocus!: InterviewFocus;
}
