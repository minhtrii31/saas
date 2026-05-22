import { Injectable } from '@nestjs/common';
import { CreateCvDto } from './dto/create-cv.dto';
import { GenerateCoverLetterDto } from './dto/generate-cover-letter.dto';
import { MatchCvDto } from './dto/match-cv.dto';
import { cvNotFound } from './cvs.errors';
import {
  type CreatedCoverLetterAnalysis,
  type CreatedCv,
  type CreatedCvAnalysis,
  type CreatedJdMatchAnalysis,
  type CvAnalysisHistoryItem,
  type CvDetail,
  type CvListItem,
  type DeletedCv,
} from './cvs.types';
import { CvAnalysisWorkflowService } from './services/cv-analysis-workflow.service';
import { CvRecordsService } from './services/cv-records.service';
import { CvUploadService } from './services/cv-upload.service';
import type { UploadedCvFile } from './types/uploaded-cv-file';

@Injectable()
export class CvsService {
  constructor(
    private readonly cvRecordsService: CvRecordsService,
    private readonly cvUploadService: CvUploadService,
    private readonly cvAnalysisWorkflowService: CvAnalysisWorkflowService,
  ) {}

  async findMany(
    userId: string,
  ): Promise<{ data: CvListItem[]; meta: Record<string, never> }> {
    const cvs = await this.cvRecordsService.findMany(userId);

    return {
      data: cvs,
      meta: {},
    };
  }

  async findOne(
    userId: string,
    id: string,
  ): Promise<{ data: CvDetail; meta: Record<string, never> }> {
    const cv = await this.cvRecordsService.findOneOwned(userId, id);

    if (!cv) {
      throw cvNotFound();
    }

    return {
      data: cv,
      meta: {},
    };
  }

  async findAnalyses(
    userId: string,
    id: string,
  ): Promise<{ data: CvAnalysisHistoryItem[]; meta: Record<string, never> }> {
    const cv = await this.cvRecordsService.findOwnedId(userId, id);

    if (!cv) {
      throw cvNotFound();
    }

    const analyses = await this.cvRecordsService.findAnalyses(cv.id);

    return {
      data: analyses,
      meta: {},
    };
  }

  async create(
    userId: string,
    dto: CreateCvDto,
  ): Promise<{ data: CreatedCv; meta: Record<string, never> }> {
    const cv = await this.cvRecordsService.create(userId, dto);

    return {
      data: cv,
      meta: {},
    };
  }

  async uploadFile(
    userId: string,
    file: UploadedCvFile | undefined,
    title?: string,
  ): Promise<{ data: CreatedCv; meta: Record<string, never> }> {
    const cv = await this.cvUploadService.uploadFile(userId, file, title);

    return {
      data: cv,
      meta: {},
    };
  }

  async remove(
    userId: string,
    id: string,
  ): Promise<{ data: DeletedCv; meta: Record<string, never> }> {
    const deletedAt = new Date();
    const deletedCount = await this.cvRecordsService.softDeleteOwned(
      userId,
      id,
      deletedAt,
    );

    if (deletedCount === 0) {
      throw cvNotFound();
    }

    return {
      data: {
        id,
        deletedAt,
      },
      meta: {},
    };
  }

  async analyze(
    userId: string,
    id: string,
  ): Promise<{ data: CreatedCvAnalysis; meta: Record<string, never> }> {
    const analysis = await this.cvAnalysisWorkflowService.analyze(userId, id);

    return {
      data: analysis,
      meta: {},
    };
  }

  async matchJobDescription(
    userId: string,
    id: string,
    dto: MatchCvDto,
  ): Promise<{ data: CreatedJdMatchAnalysis; meta: Record<string, never> }> {
    const analysis = await this.cvAnalysisWorkflowService.matchJobDescription(
      userId,
      id,
      dto,
    );

    return {
      data: analysis,
      meta: {},
    };
  }

  async generateCoverLetter(
    userId: string,
    id: string,
    dto: GenerateCoverLetterDto,
  ): Promise<{
    data: CreatedCoverLetterAnalysis;
    meta: Record<string, never>;
  }> {
    const analysis = await this.cvAnalysisWorkflowService.generateCoverLetter(
      userId,
      id,
      dto,
    );

    return {
      data: analysis,
      meta: {},
    };
  }
}
