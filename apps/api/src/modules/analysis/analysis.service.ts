import { Inject, Injectable } from '@nestjs/common';
import { CV_ANALYSIS_PROVIDER } from './tokens/cv-analysis-provider.token';
import type {
  CvAnalysisProvider,
  CvAnalysisResponse,
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
}
