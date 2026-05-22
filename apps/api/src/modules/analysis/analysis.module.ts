import { Module } from '@nestjs/common';
import { EnvironmentService } from '../../config/environment.service';
import { AnalysisService } from './analysis.service';
import { MockCvAnalysisProvider } from './providers/mock-cv-analysis.provider';
import { OpenAiAnalysisProvider } from './providers/openai-analysis.provider';
import { CV_ANALYSIS_PROVIDER } from './tokens/cv-analysis-provider.token';

@Module({
  providers: [
    AnalysisService,
    EnvironmentService,
    MockCvAnalysisProvider,
    OpenAiAnalysisProvider,
    {
      provide: CV_ANALYSIS_PROVIDER,
      inject: [
        EnvironmentService,
        MockCvAnalysisProvider,
        OpenAiAnalysisProvider,
      ],
      useFactory: (
        environmentService: EnvironmentService,
        mockProvider: MockCvAnalysisProvider,
        openAiProvider: OpenAiAnalysisProvider,
      ) =>
        environmentService.aiProvider === 'openai'
          ? openAiProvider
          : mockProvider,
    },
  ],
  exports: [AnalysisService],
})
export class AnalysisModule {}
