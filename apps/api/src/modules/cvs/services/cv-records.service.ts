import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateCvDto, type SupportedCvMimeType } from '../dto/create-cv.dto';
import {
  cvAnalysisHistorySelect,
  cvSelect,
  type CreatedCv,
  type CvAnalysisHistoryItem,
  type CvDetail,
  type CvListItem,
  type OwnedCvText,
} from '../cvs.types';

type CreateUploadedCvInput = {
  title?: string;
  originalName: string;
  mimeType: SupportedCvMimeType;
  sizeBytes: number;
  storageProvider: string;
  storageKey: string;
  storageUrl: string | null;
  extractedText: string | null;
};

@Injectable()
export class CvRecordsService {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(userId: string): Promise<CvListItem[]> {
    return this.prisma.cv.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: cvSelect,
    });
  }

  async findOneOwned(userId: string, id: string): Promise<CvDetail | null> {
    return this.prisma.cv.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
      select: cvSelect,
    });
  }

  async findOwnedText(userId: string, id: string): Promise<OwnedCvText | null> {
    return this.prisma.cv.findFirst({
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
  }

  async findOwnedId(
    userId: string,
    id: string,
  ): Promise<{ id: string } | null> {
    return this.prisma.cv.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });
  }

  async findAnalyses(cvId: string): Promise<CvAnalysisHistoryItem[]> {
    return this.prisma.cvAnalysis.findMany({
      where: {
        cvId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: cvAnalysisHistorySelect,
    });
  }

  async create(userId: string, dto: CreateCvDto): Promise<CreatedCv> {
    return this.prisma.cv.create({
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
  }

  async createFromUpload(
    userId: string,
    input: CreateUploadedCvInput,
  ): Promise<CreatedCv> {
    return this.prisma.cv.create({
      data: {
        userId,
        title: input.title ?? input.originalName,
        originalName: input.originalName,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        storageProvider: input.storageProvider,
        storageKey: input.storageKey,
        storageUrl: input.storageUrl,
        extractedText: input.extractedText,
        deletedAt: null,
      },
      select: cvSelect,
    });
  }

  async softDeleteOwned(
    userId: string,
    id: string,
    deletedAt: Date,
  ): Promise<number> {
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

    return result.count;
  }
}
