import { Inject, Injectable, Optional } from '@nestjs/common';
import { EnvironmentService } from '../../config/environment.service';
import { CV_ANALYSIS_PROVIDER } from './tokens/cv-analysis-provider.token';
import type {
  CvAnalysisProvider,
  CvAnalysisResponse,
  ApplicationFollowUpInput,
  ApplicationFollowUpResponse,
  CoverLetterGenerationInput,
  CoverLetterResponse,
  InterviewPrepInput,
  InterviewPrepResponse,
  JdMatchResponse,
  ResumeRewriteInput,
  ResumeRewriteResponse,
  RewriteRefinementInput,
  RewriteRefinementResponse,
} from './types/cv-analysis-provider';
import {
  DEFAULT_PROVIDER_INPUT_LIMITS,
  normalizeCvProviderText,
  normalizeJdProviderText,
} from './utils/provider-input-normalizer';

@Injectable()
export class AnalysisService {
  constructor(
    @Inject(CV_ANALYSIS_PROVIDER)
    private readonly cvAnalysisProvider: CvAnalysisProvider,
    @Optional()
    private readonly environmentService?: EnvironmentService,
  ) {}

  async analyzeCv(extractedText: string): Promise<CvAnalysisResponse> {
    const result = await this.cvAnalysisProvider.analyzeCv(
      this.normalizeCvText(extractedText),
    );

    return {
      aiProvider: this.cvAnalysisProvider.providerName,
      aiModel: this.cvAnalysisProvider.modelName,
      result,
    };
  }

  async matchJobDescription(
    extractedText: string,
    jobDescriptionText: string,
  ): Promise<JdMatchResponse> {
    const result = await this.cvAnalysisProvider.matchJobDescription(
      this.normalizeCvText(extractedText),
      this.normalizeJdText(jobDescriptionText),
    );

    return {
      aiProvider: this.cvAnalysisProvider.providerName,
      aiModel: this.cvAnalysisProvider.jdMatcherModelName,
      result,
    };
  }

  async generateCoverLetter(
    extractedText: string,
    input: CoverLetterGenerationInput,
  ): Promise<CoverLetterResponse> {
    const result = await this.cvAnalysisProvider.generateCoverLetter(
      this.normalizeCvText(extractedText),
      {
        ...input,
        jobDescriptionText: this.normalizeJdText(input.jobDescriptionText),
      },
    );

    return {
      aiProvider: this.cvAnalysisProvider.providerName,
      aiModel: this.cvAnalysisProvider.coverLetterModelName,
      result,
    };
  }

  async rewriteResume(
    extractedText: string,
    input: ResumeRewriteInput,
  ): Promise<ResumeRewriteResponse> {
    const result = await this.cvAnalysisProvider.rewriteResume(
      this.normalizeCvText(extractedText),
      input,
    );

    return {
      aiProvider: this.cvAnalysisProvider.providerName,
      aiModel: this.cvAnalysisProvider.resumeRewriteModelName,
      result,
    };
  }

  async refineRewrite(
    extractedText: string,
    input: RewriteRefinementInput,
  ): Promise<RewriteRefinementResponse> {
    const result = await this.cvAnalysisProvider.refineRewrite(
      this.normalizeCvText(extractedText),
      input,
    );

    return {
      aiProvider: this.cvAnalysisProvider.providerName,
      aiModel: this.cvAnalysisProvider.resumeRewriteModelName,
      result,
    };
  }

  async generateInterviewPrep(
    extractedText: string,
    input: InterviewPrepInput,
  ): Promise<InterviewPrepResponse> {
    const result = await this.cvAnalysisProvider.generateInterviewPrep(
      this.normalizeCvText(extractedText),
      {
        ...input,
        jobDescriptionText:
          input.jobDescriptionText === undefined
            ? undefined
            : this.normalizeJdText(input.jobDescriptionText),
      },
    );

    return {
      aiProvider: this.cvAnalysisProvider.providerName,
      aiModel: this.cvAnalysisProvider.interviewPrepModelName,
      result,
    };
  }

  async generateApplicationFollowUp(
    extractedText: string,
    input: ApplicationFollowUpInput,
  ): Promise<ApplicationFollowUpResponse> {
    const result = await this.cvAnalysisProvider.generateApplicationFollowUp(
      this.normalizeCvText(extractedText),
      input,
    );

    return {
      aiProvider: this.cvAnalysisProvider.providerName,
      aiModel: this.cvAnalysisProvider.applicationFollowUpModelName,
      result,
    };
  }

  private normalizeCvText(value: string): string {
    return normalizeCvProviderText(value, {
      maxCvChars:
        this.environmentService?.aiMaxCvChars ??
        DEFAULT_PROVIDER_INPUT_LIMITS.maxCvChars,
    });
  }

  private normalizeJdText(value: string): string {
    return normalizeJdProviderText(value, {
      maxJdChars:
        this.environmentService?.aiMaxJdChars ??
        DEFAULT_PROVIDER_INPUT_LIMITS.maxJdChars,
    });
  }
}
