import { Module } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { MockCvAnalysisProvider } from './providers/mock-cv-analysis.provider';
import { CV_ANALYSIS_PROVIDER } from './tokens/cv-analysis-provider.token';

@Module({
  providers: [
    AnalysisService,
    MockCvAnalysisProvider,
    {
      provide: CV_ANALYSIS_PROVIDER,
      useExisting: MockCvAnalysisProvider,
    },
  ],
  exports: [AnalysisService],
})
export class AnalysisModule {}
