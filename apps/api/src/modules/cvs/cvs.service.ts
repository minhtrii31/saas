import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EnvironmentService } from '../../config/environment.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateCvDto,
  type SupportedCvMimeType,
  supportedCvMimeTypes,
} from './dto/create-cv.dto';
import { FileStorageService } from './services/file-storage.service';
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

@Injectable()
export class CvsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileStorageService: FileStorageService,
    private readonly environmentService: EnvironmentService,
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

    try {
      const originalName = validFile.originalname ?? 'file';
      const mimeType = validFile.mimetype as SupportedCvMimeType;
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
          extractedText: null,
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
