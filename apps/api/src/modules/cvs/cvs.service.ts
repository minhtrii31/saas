import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { EnvironmentService } from '../../config/environment.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalysisService } from '../analysis/analysis.service';
import type {
  CvAnalysisResult,
  JdMatchResult,
} from '../analysis/types/cv-analysis-provider';
import {
  CreateCvDto,
  type SupportedCvMimeType,
  supportedCvMimeTypes,
} from './dto/create-cv.dto';
import { MatchCvDto } from './dto/match-cv.dto';
import { FileStorageService } from './services/file-storage.service';
import { PdfTextExtractor } from './services/pdf-text-extractor.service';
import type { UploadedCvFile } from './types/uploaded-cv-file';

type CreatedCv = {
  id: string;
  title: string | null;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  storageProvider: string;
  storageKey: string;
  storageUrl: string | null;
  extractedText: string | null;
  createdAt: Date;
};

type CvListItem = CreatedCv;
type CvDetail = CreatedCv;
type DeletedCv = {
  id: string;
  deletedAt: Date | null;
};
type CreatedCvAnalysis = {
  id: string;
  cvId: string;
  type: string;
  aiProvider: string | null;
  aiModel: string | null;
  result: CvAnalysisResult;
  createdAt: Date;
};
type CreatedJdMatchAnalysis = {
  id: string;
  cvId: string;
  type: string;
  jobDescriptionText: string | null;
  aiProvider: string | null;
  aiModel: string | null;
  result: JdMatchResult;
  createdAt: Date;
};
type CvAnalysisHistoryItem = {
  id: string;
  cvId: string;
  type: string;
  jobDescriptionText: string | null;
  aiProvider: string | null;
  aiModel: string | null;
  result: unknown;
  createdAt: Date;
};

const cvSelect = {
  id: true,
  title: true,
  originalName: true,
  mimeType: true,
  sizeBytes: true,
  storageProvider: true,
  storageKey: true,
  storageUrl: true,
  extractedText: true,
  createdAt: true,
};
const cvAnalysisSelect = {
  id: true,
  cvId: true,
  type: true,
  aiProvider: true,
  aiModel: true,
  result: true,
  createdAt: true,
};
const jdMatchAnalysisSelect = {
  id: true,
  cvId: true,
  type: true,
  jobDescriptionText: true,
  aiProvider: true,
  aiModel: true,
  result: true,
  createdAt: true,
};
const cvAnalysisHistorySelect = {
  id: true,
  cvId: true,
  type: true,
  jobDescriptionText: true,
  aiProvider: true,
  aiModel: true,
  result: true,
  createdAt: true,
};

@Injectable()
export class CvsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileStorageService: FileStorageService,
    private readonly pdfTextExtractor: PdfTextExtractor,
    private readonly environmentService: EnvironmentService,
    private readonly analysisService: AnalysisService,
  ) {}

  async findMany(
    userId: string,
  ): Promise<{ data: CvListItem[]; meta: Record<string, never> }> {
    const cvs = await this.prisma.cv.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: cvSelect,
    });

    return {
      data: cvs,
      meta: {},
    };
  }

  async findOne(
    userId: string,
    id: string,
  ): Promise<{ data: CvDetail; meta: Record<string, never> }> {
    const cv = await this.prisma.cv.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
      select: cvSelect,
    });

    if (!cv) {
      throw this.cvNotFound();
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
    const cv = await this.prisma.cv.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!cv) {
      throw this.cvNotFound();
    }

    const analyses = await this.prisma.cvAnalysis.findMany({
      where: {
        cvId: cv.id,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: cvAnalysisHistorySelect,
    });

    return {
      data: analyses,
      meta: {},
    };
  }

  async create(
    userId: string,
    dto: CreateCvDto,
  ): Promise<{ data: CreatedCv; meta: Record<string, never> }> {
    const cv = await this.prisma.cv.create({
      data: {
        userId,
        title: dto.title ?? null,
        originalName: dto.originalName,
        mimeType: dto.mimeType,
        sizeBytes: dto.sizeBytes,
        storageProvider: dto.storageProvider,
        storageKey: dto.storageKey,
        storageUrl: dto.storageUrl ?? null,
        extractedText: null,
        deletedAt: null,
      },
      select: cvSelect,
    });

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
    const validFile = this.validateUploadFile(file);
    const uploadResult = await this.fileStorageService.uploadLocal(
      userId,
      validFile,
    );
    const mimeType = validFile.mimetype as SupportedCvMimeType;
    let extractedText: string | null = null;

    if (mimeType === 'application/pdf') {
      try {
        const filePath = this.fileStorageService.getLocalPath(
          uploadResult.storageKey,
        );
        extractedText = await this.pdfTextExtractor.extractFromFile(filePath);
      } catch {
        await this.fileStorageService.deleteFile(uploadResult.storageKey);
        throw new UnprocessableEntityException({
          error: {
            code: 'PDF_TEXT_EXTRACTION_FAILED',
            message: 'Could not extract text from PDF file',
          },
          meta: {},
        });
      }
    }

    try {
      const originalName = validFile.originalname ?? 'file';
      const sizeBytes = validFile.size ?? 0;

      const cv = await this.prisma.cv.create({
        data: {
          userId,
          title: title ?? originalName,
          originalName,
          mimeType,
          sizeBytes,
          storageProvider: 'local',
          storageKey: uploadResult.storageKey,
          storageUrl: uploadResult.storageUrl ?? null,
          extractedText,
          deletedAt: null,
        },
        select: cvSelect,
      });

      return {
        data: cv,
        meta: {},
      };
    } catch (error) {
      // Cleanup uploaded file if Cv creation fails
      await this.fileStorageService.deleteFile(uploadResult.storageKey);
      throw error;
    }
  }

  async remove(
    userId: string,
    id: string,
  ): Promise<{ data: DeletedCv; meta: Record<string, never> }> {
    const deletedAt = new Date();
    const result = await this.prisma.cv.updateMany({
      where: {
        id,
        userId,
        deletedAt: null,
      },
      data: {
        deletedAt,
      },
    });

    if (result.count === 0) {
      throw this.cvNotFound();
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
    const cv = await this.prisma.cv.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
      select: {
        id: true,
        extractedText: true,
      },
    });

    if (!cv) {
      throw this.cvNotFound();
    }

    if (!cv.extractedText?.trim()) {
      throw new UnprocessableEntityException({
        error: {
          code: 'CV_TEXT_NOT_EXTRACTED',
          message: 'CV text has not been extracted',
        },
        meta: {},
      });
    }

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

    return {
      data: analysis as CreatedCvAnalysis,
      meta: {},
    };
  }

  async matchJobDescription(
    userId: string,
    id: string,
    dto: MatchCvDto,
  ): Promise<{ data: CreatedJdMatchAnalysis; meta: Record<string, never> }> {
    const cv = await this.prisma.cv.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
      select: {
        id: true,
        extractedText: true,
      },
    });

    if (!cv) {
      throw this.cvNotFound();
    }

    if (!cv.extractedText?.trim()) {
      throw new UnprocessableEntityException({
        error: {
          code: 'CV_TEXT_NOT_EXTRACTED',
          message: 'CV text has not been extracted',
        },
        meta: {},
      });
    }

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

    return {
      data: analysis as CreatedJdMatchAnalysis,
      meta: {},
    };
  }

  private cvNotFound(): NotFoundException {
    return new NotFoundException({
      error: {
        code: 'CV_NOT_FOUND',
        message: 'CV not found',
      },
      meta: {},
    });
  }

  private validateUploadFile(file: UploadedCvFile | undefined): UploadedCvFile {
    if (!file) {
      throw new BadRequestException({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'File is required',
        },
        meta: {},
      });
    }

    const mimeType = file.mimetype ?? '';
    if (!this.isSupportedCvMimeType(mimeType)) {
      throw new BadRequestException({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Only PDF, DOC, and DOCX files are supported',
        },
        meta: {},
      });
    }

    const maxFileSize = this.environmentService.optionalInt(
      'CV_MAX_FILE_SIZE_BYTES',
      5242880,
    );
    const fileSize = file.size ?? 0;
    if (fileSize > maxFileSize) {
      const maxSizeMb = Math.round(maxFileSize / 1024 / 1024);
      throw new BadRequestException({
        error: {
          code: 'VALIDATION_ERROR',
          message: `File size exceeds maximum of ${maxSizeMb} MB`,
        },
        meta: {},
      });
    }

    return file;
  }

  private isSupportedCvMimeType(
    mimeType: string,
  ): mimeType is SupportedCvMimeType {
    return supportedCvMimeTypes.includes(mimeType as SupportedCvMimeType);
  }
}
