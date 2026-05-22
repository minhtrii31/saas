import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import type { UploadedCvFile } from '../types/uploaded-cv-file';

export interface UploadedFile {
  storageKey: string;
  storageUrl: string | null;
}

@Injectable()
export class FileStorageService {
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
      storageKey,
      storageUrl: null,
    };
  }

  async deleteFile(storageKey: string): Promise<void> {
    try {
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
}
