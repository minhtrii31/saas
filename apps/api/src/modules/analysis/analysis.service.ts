import { Inject, Injectable } from '@nestjs/common';
import { CV_ANALYSIS_PROVIDER } from './tokens/cv-analysis-provider.token';
import type {
  CvAnalysisProvider,
  CvAnalysisResponse,
  CoverLetterGenerationInput,
  CoverLetterResponse,
  JdMatchResponse,
  ResumeRewriteInput,
  ResumeRewriteResponse,
  RewriteRefinementInput,
  RewriteRefinementResponse,
} from './types/cv-analysis-provider';

@Injectable()
export class AnalysisService {
  constructor(
    @Inject(CV_ANALYSIS_PROVIDER)
    private readonly cvAnalysisProvider: CvAnalysisProvider,
  ) {}

  async analyzeCv(extractedText: string): Promise<CvAnalysisResponse> {
    const result = await this.cvAnalysisProvider.analyzeCv(extractedText);

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
      extractedText,
      jobDescriptionText,
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
      extractedText,
      input,
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
      extractedText,
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
      extractedText,
      input,
    );

    return {
      aiProvider: this.cvAnalysisProvider.providerName,
      aiModel: this.cvAnalysisProvider.resumeRewriteModelName,
      result,
    };
  }
}
