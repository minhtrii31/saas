import {
  BadRequestException,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { EnvironmentService } from '../../../config/environment.service';
import {
  type SupportedCvMimeType,
  supportedCvMimeTypes,
} from '../dto/create-cv.dto';
import { type CreatedCv } from '../cvs.types';
import type { UploadedCvFile } from '../types/uploaded-cv-file';
import { CvRecordsService } from './cv-records.service';
import { FileStorageService } from './file-storage.service';
import { PdfTextExtractor } from './pdf-text-extractor.service';

@Injectable()
export class CvUploadService {
  constructor(
    private readonly cvRecordsService: CvRecordsService,
    private readonly fileStorageService: FileStorageService,
    private readonly pdfTextExtractor: PdfTextExtractor,
    private readonly environmentService: EnvironmentService,
  ) {}

  async uploadFile(
    userId: string,
    file: UploadedCvFile | undefined,
    title?: string,
  ): Promise<CreatedCv> {
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

      return await this.cvRecordsService.createFromUpload(userId, {
        title,
        originalName,
        mimeType,
        sizeBytes,
        storageProvider: 'local',
        storageKey: uploadResult.storageKey,
        storageUrl: uploadResult.storageUrl ?? null,
        extractedText,
      });
    } catch (error) {
      // Cleanup uploaded file if Cv creation fails
      await this.fileStorageService.deleteFile(uploadResult.storageKey);
      throw error;
    }
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

    if (!this.contentMatchesMimeType(file.buffer, mimeType)) {
      throw new BadRequestException({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'File content does not match the declared file type',
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

  private contentMatchesMimeType(
    buffer: Buffer,
    mimeType: SupportedCvMimeType,
  ): boolean {
    if (mimeType === 'application/pdf') {
      return buffer.subarray(0, 5).toString('ascii') === '%PDF-';
    }

    if (mimeType === 'application/msword') {
      const docMagic = Buffer.from([
        0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1,
      ]);

      return buffer.subarray(0, docMagic.length).equals(docMagic);
    }

    const zipHeader = buffer.subarray(0, 4);
    if (!zipHeader.equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]))) {
      return false;
    }

    const searchablePrefix = buffer
      .subarray(0, Math.min(buffer.length, 4096))
      .toString('utf8');

    return (
      searchablePrefix.includes('[Content_Types].xml') &&
      searchablePrefix.includes('word/')
    );
  }
}
