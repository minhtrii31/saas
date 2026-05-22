import { Inject, Injectable } from '@nestjs/common';
import { CV_ANALYSIS_PROVIDER } from './tokens/cv-analysis-provider.token';
import type {
  CvAnalysisProvider,
  CvAnalysisResponse,
  JdMatchResponse,
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
}
