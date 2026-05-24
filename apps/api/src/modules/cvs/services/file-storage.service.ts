import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';
import { EnvironmentService } from '../../../config/environment.service';
import type { UploadedCvFile } from '../types/uploaded-cv-file';

export interface UploadedFile {
  storageProvider: 'local' | 'cloudinary';
  storageKey: string;
  storageUrl: string | null;
}

@Injectable()
export class FileStorageService {
  constructor(private readonly environmentService: EnvironmentService) {}

  async uploadLocal(
    userId: string,
    file: UploadedCvFile,
  ): Promise<UploadedFile> {
    const dirPath = path.join(process.cwd(), 'uploads', 'cvs', userId);

    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch {
      throw new InternalServerErrorException({
        error: {
          code: 'STORAGE_ERROR',
          message: 'Failed to create upload directory',
        },
        meta: {},
      });
    }

    const timestamp = Date.now();
    const uuid = randomUUID();
    const originalName = file.originalname ?? 'file';
    const sanitized = this.sanitizeFilename(originalName);
    const filename = `${timestamp}-${uuid}-${sanitized}`;
    const filePath = path.join(dirPath, filename);

    try {
      await fs.writeFile(filePath, file.buffer);
    } catch {
      throw new InternalServerErrorException({
        error: {
          code: 'STORAGE_ERROR',
          message: 'Failed to write file to storage',
        },
        meta: {},
      });
    }

    const storageKey = path.posix.join('cvs', userId, filename);
    return {
      storageProvider: 'local',
      storageKey,
      storageUrl: null,
    };
  }

  async uploadCloudinary(
    userId: string,
    file: UploadedCvFile,
  ): Promise<UploadedFile> {
    cloudinary.config({
      cloud_name: this.environmentService.cloudinaryCloudName,
      api_key: this.environmentService.cloudinaryApiKey,
      api_secret: this.environmentService.cloudinaryApiSecret,
      secure: true,
    });

    const publicId = this.buildCloudinaryPublicId(userId, file.originalname);
    const folder = this.environmentService.cloudinaryCvFolder;

    try {
      const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder,
            public_id: publicId,
            resource_type: 'raw',
            use_filename: false,
            unique_filename: false,
            overwrite: false,
          },
          (error, uploadResult) => {
            if (error) {
              reject(this.normalizeCloudinaryError(error));
              return;
            }

            if (!uploadResult) {
              reject(new Error('Cloudinary upload returned no result'));
              return;
            }

            resolve(uploadResult);
          },
        );

        stream.end(file.buffer);
      });

      return {
        storageProvider: 'cloudinary',
        storageKey: result.public_id,
        storageUrl: result.secure_url,
      };
    } catch {
      throw new InternalServerErrorException({
        error: {
          code: 'STORAGE_ERROR',
          message: 'Failed to upload file to Cloudinary',
        },
        meta: {},
      });
    }
  }

  async deleteFile(
    storageKey: string,
    storageProvider: 'local' | 'cloudinary' = 'local',
  ): Promise<void> {
    try {
      if (storageProvider === 'cloudinary') {
        await cloudinary.uploader.destroy(storageKey, { resource_type: 'raw' });
        return;
      }

      const filePath = this.getLocalPath(storageKey);
      await fs.unlink(filePath);
    } catch {
      // Silently ignore delete errors - file may already be gone
    }
  }

  getLocalPath(storageKey: string): string {
    const normalizedKey = storageKey.replace(/\\/g, '/');
    const segments = normalizedKey.split('/');

    if (
      path.isAbsolute(storageKey) ||
      normalizedKey.length === 0 ||
      normalizedKey.includes('\0') ||
      segments.some((segment) => segment === '..' || segment.length === 0)
    ) {
      throw new BadRequestException({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Unsafe storage key',
        },
        meta: {},
      });
    }

    const uploadRoot = path.resolve(process.cwd(), 'uploads');
    const filePath = path.resolve(uploadRoot, normalizedKey);
    const relativePath = path.relative(uploadRoot, filePath);

    if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
      throw new BadRequestException({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Unsafe storage key',
        },
        meta: {},
      });
    }

    return filePath;
  }

  private sanitizeFilename(filename: string): string {
    const basename = path.posix.basename(filename.replace(/\\/g, '/'));
    const sanitized = basename
      .replace(/[^a-z0-9._-]/gi, '_')
      .replace(/^\.+/, '')
      .replace(/_{2,}/g, '_')
      .substring(0, 200);

    return sanitized.length > 0 ? sanitized : 'file';
  }

  private buildCloudinaryPublicId(
    userId: string,
    originalName: string | undefined,
  ): string {
    const timestamp = Date.now();
    const uuid = randomUUID();
    const sanitized = this.sanitizeFilename(originalName ?? 'file');

    return path.posix.join(userId, `${timestamp}-${uuid}-${sanitized}`);
  }

  private normalizeCloudinaryError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }

    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof error.message === 'string'
    ) {
      return new Error(error.message);
    }

    return new Error('Cloudinary upload failed');
  }
}
