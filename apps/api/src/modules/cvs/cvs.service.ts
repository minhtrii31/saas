import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCvDto } from './dto/create-cv.dto';

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

@Injectable()
export class CvsService {
  constructor(private readonly prisma: PrismaService) {}

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
      select: {
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
      },
    });

    return {
      data: cv,
      meta: {},
    };
  }
}
