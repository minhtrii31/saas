import { Transform } from 'class-transformer';
import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import type { RewriteRefinementInstruction } from '../../analysis/types/cv-analysis-provider';
import { maxOriginalResumeTextLength } from './rewrite-resume.dto';

export const rewriteRefinementInstructions = [
  'stronger',
  'shorter',
  'more-technical',
  'more-leadership',
  'more-ats-friendly',
  'more-results-focused',
] as const satisfies readonly RewriteRefinementInstruction[];

export class RefineRewriteDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'original is required' })
  @IsNotEmpty({ message: 'original is required' })
  @MaxLength(maxOriginalResumeTextLength)
  original!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'currentRewrite is required' })
  @IsNotEmpty({ message: 'currentRewrite is required' })
  @MaxLength(maxOriginalResumeTextLength)
  currentRewrite!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'instruction is required' })
  @IsNotEmpty({ message: 'instruction is required' })
  @IsIn(rewriteRefinementInstructions, {
    message:
      'instruction must be one of stronger, shorter, more-technical, more-leadership, more-ats-friendly, more-results-focused',
  })
  instruction!: RewriteRefinementInstruction;
}
