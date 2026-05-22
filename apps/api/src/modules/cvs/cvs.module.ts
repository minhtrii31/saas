import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AnalysisModule } from '../analysis/analysis.module';
import { AuthModule } from '../auth/auth.module';
import { CvsController } from './cvs.controller';
import { CvsService } from './cvs.service';
import { FileStorageService } from './services/file-storage.service';
import { EnvironmentService } from '../../config/environment.service';
import { PdfTextExtractor } from './services/pdf-text-extractor.service';
import { CvRecordsService } from './services/cv-records.service';
import { CvUploadService } from './services/cv-upload.service';
import { CvAnalysisWorkflowService } from './services/cv-analysis-workflow.service';

@Module({
  imports: [PrismaModule, AuthModule, AnalysisModule],
  controllers: [CvsController],
  providers: [
    CvsService,
    CvRecordsService,
    CvUploadService,
    CvAnalysisWorkflowService,
    FileStorageService,
    PdfTextExtractor,
    EnvironmentService,
  ],
})
export class CvsModule {}
