import { Transform } from 'class-transformer';
import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import type { ResumeRewriteGoal } from '../../analysis/types/cv-analysis-provider';

export const resumeRewriteGoals = [
  'stronger-impact',
  'ats-optimization',
  'concise',
  'quantified-achievements',
  'leadership-tone',
] as const satisfies readonly ResumeRewriteGoal[];

export const maxOriginalResumeTextLength = 4000;

export class RewriteResumeDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'originalText is required' })
  @IsNotEmpty({ message: 'originalText is required' })
  @MaxLength(maxOriginalResumeTextLength)
  originalText!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'rewriteGoal is required' })
  @IsNotEmpty({ message: 'rewriteGoal is required' })
  @IsIn(resumeRewriteGoals, {
    message:
      'rewriteGoal must be one of stronger-impact, ats-optimization, concise, quantified-achievements, leadership-tone',
  })
  rewriteGoal!: ResumeRewriteGoal;
}
