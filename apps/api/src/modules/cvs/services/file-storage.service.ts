import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { randomBytes } from 'crypto';
import type { Multer } from 'multer';

export interface UploadedFile {
  storageKey: string;
  storageUrl: string | null;
}

@Injectable()
export class FileStorageService {
  async uploadLocal(userId: string, file: Multer.File): Promise<UploadedFile> {
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
    const randomSuffix = randomBytes(4).toString('hex');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const originalname: string = file.originalname ?? 'file';
    const sanitized = this.sanitizeFilename(originalname);
    const filename = `${timestamp}-${randomSuffix}-${sanitized}`;
    const filePath = path.join(dirPath, filename);

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
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

    const storageKey = path.join('cvs', userId, filename);
    return {
      storageKey,
      storageUrl: null,
    };
  }

  async deleteFile(storageKey: string): Promise<void> {
    try {
      const filePath = path.join(process.cwd(), 'uploads', storageKey);
      await fs.unlink(filePath);
    } catch {
      // Silently ignore delete errors - file may already be gone
    }
  }

  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-z0-9._-]/gi, '_')
      .replace(/_{2,}/g, '_')
      .substring(0, 200);
  }
}
