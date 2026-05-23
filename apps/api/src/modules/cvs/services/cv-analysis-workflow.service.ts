import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AnalysisService } from '../../analysis/analysis.service';
import { GenerateCoverLetterDto } from '../dto/generate-cover-letter.dto';
import { MatchCvDto } from '../dto/match-cv.dto';
import { RefineRewriteDto } from '../dto/refine-rewrite.dto';
import { RewriteResumeDto } from '../dto/rewrite-resume.dto';
import { cvNotFound, cvTextNotExtracted } from '../cvs.errors';
import {
  cvAnalysisSelect,
  jdMatchAnalysisSelect,
  type CreatedCoverLetterAnalysis,
  type CreatedCvAnalysis,
  type CreatedJdMatchAnalysis,
  type CreatedRewriteRefinementAnalysis,
  type CreatedResumeRewriteAnalysis,
} from '../cvs.types';
import { CvRecordsService } from './cv-records.service';

@Injectable()
export class CvAnalysisWorkflowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cvRecordsService: CvRecordsService,
    private readonly analysisService: AnalysisService,
  ) {}

  async analyze(userId: string, id: string): Promise<CreatedCvAnalysis> {
    const cv = await this.findOwnedCvWithExtractedText(userId, id);

    const cvAnalysis = await this.analysisService.analyzeCv(cv.extractedText);
    const analysis = await this.prisma.cvAnalysis.create({
      data: {
        cvId: cv.id,
        type: 'CV_ANALYSIS',
        aiProvider: cvAnalysis.aiProvider,
        aiModel: cvAnalysis.aiModel,
        result: cvAnalysis.result,
      },
      select: cvAnalysisSelect,
    });

    return analysis as CreatedCvAnalysis;
  }

  async matchJobDescription(
    userId: string,
    id: string,
    dto: MatchCvDto,
  ): Promise<CreatedJdMatchAnalysis> {
    const cv = await this.findOwnedCvWithExtractedText(userId, id);

    const cvAnalysis = await this.analysisService.matchJobDescription(
      cv.extractedText,
      dto.jobDescriptionText,
    );
    const analysis = await this.prisma.cvAnalysis.create({
      data: {
        cvId: cv.id,
        type: 'JD_MATCH',
        jobDescriptionText: dto.jobDescriptionText,
        aiProvider: cvAnalysis.aiProvider,
        aiModel: cvAnalysis.aiModel,
        result: cvAnalysis.result,
      },
      select: jdMatchAnalysisSelect,
    });

    return analysis as CreatedJdMatchAnalysis;
  }

  async generateCoverLetter(
    userId: string,
    id: string,
    dto: GenerateCoverLetterDto,
  ): Promise<CreatedCoverLetterAnalysis> {
    const cv = await this.findOwnedCvWithExtractedText(userId, id);

    const cvAnalysis = await this.analysisService.generateCoverLetter(
      cv.extractedText,
      dto,
    );
    const analysis = await this.prisma.cvAnalysis.create({
      data: {
        cvId: cv.id,
        type: 'COVER_LETTER',
        jobDescriptionText: dto.jobDescriptionText,
        aiProvider: cvAnalysis.aiProvider,
        aiModel: cvAnalysis.aiModel,
        result: cvAnalysis.result,
      },
      select: jdMatchAnalysisSelect,
    });

    return analysis as unknown as CreatedCoverLetterAnalysis;
  }

  async rewriteResume(
    userId: string,
    id: string,
    dto: RewriteResumeDto,
  ): Promise<CreatedResumeRewriteAnalysis> {
    const cv = await this.findOwnedCvWithExtractedText(userId, id);

    const cvAnalysis = await this.analysisService.rewriteResume(
      cv.extractedText,
      dto,
    );
    const analysis = await this.prisma.cvAnalysis.create({
      data: {
        cvId: cv.id,
        type: 'RESUME_REWRITE',
        aiProvider: cvAnalysis.aiProvider,
        aiModel: cvAnalysis.aiModel,
        result: cvAnalysis.result,
      },
      select: cvAnalysisSelect,
    });

    return analysis as unknown as CreatedResumeRewriteAnalysis;
  }

  async refineRewrite(
    userId: string,
    id: string,
    dto: RefineRewriteDto,
  ): Promise<CreatedRewriteRefinementAnalysis> {
    const cv = await this.findOwnedCvWithExtractedText(userId, id);

    const cvAnalysis = await this.analysisService.refineRewrite(
      cv.extractedText,
      dto,
    );
    const analysis = await this.prisma.cvAnalysis.create({
      data: {
        cvId: cv.id,
        type: 'REWRITE_REFINEMENT',
        aiProvider: cvAnalysis.aiProvider,
        aiModel: cvAnalysis.aiModel,
        result: cvAnalysis.result,
      },
      select: cvAnalysisSelect,
    });

    return analysis as unknown as CreatedRewriteRefinementAnalysis;
  }

  private async findOwnedCvWithExtractedText(userId: string, id: string) {
    const cv = await this.cvRecordsService.findOwnedText(userId, id);

    if (!cv) {
      throw cvNotFound();
    }

    if (!cv.extractedText?.trim()) {
      throw cvTextNotExtracted();
    }

    return {
      id: cv.id,
      extractedText: cv.extractedText,
    };
  }
}
