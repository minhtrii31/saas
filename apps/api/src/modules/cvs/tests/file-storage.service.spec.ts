import { promises as fs } from 'fs';
import * as path from 'path';
import { BadRequestException } from '@nestjs/common';
import { FileStorageService } from '../services/file-storage.service';
import type { UploadedCvFile } from '../types/uploaded-cv-file';

jest.mock('crypto', () => ({
  randomUUID: jest.fn(() => '550e8400-e29b-41d4-a716-446655440000'),
}));

describe('FileStorageService', () => {
  const service = new FileStorageService();
  const userId = '43a84c6a-4bcf-47c1-a1e1-215ba79c9404';
  const uploadRoot = path.join(process.cwd(), 'uploads');

  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(1779455400000);
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await fs.rm(path.join(uploadRoot, 'cvs', userId), {
      recursive: true,
      force: true,
    });
  });

  it('stores local CV files under uploads/cvs/<userId> with a safe unique filename', async () => {
    const file = {
      originalname: '../../My CV (final).pdf',
      buffer: Buffer.from('PDF content'),
    } satisfies UploadedCvFile;

    const result = await service.uploadLocal(userId, file);

    expect(result).toEqual({
      storageKey:
        'cvs/43a84c6a-4bcf-47c1-a1e1-215ba79c9404/1779455400000-550e8400-e29b-41d4-a716-446655440000-My_CV_final_.pdf',
      storageUrl: null,
    });

    await expect(
      fs.readFile(path.join(uploadRoot, result.storageKey), 'utf8'),
    ).resolves.toBe('PDF content');
  });

  it('rejects storage keys that traverse outside the uploads directory', () => {
    expect(() => service.getLocalPath('../secrets.txt')).toThrow(
      BadRequestException,
    );
    expect(() =>
      service.getLocalPath(
        'cvs/43a84c6a-4bcf-47c1-a1e1-215ba79c9404/../../secrets.txt',
      ),
    ).toThrow(BadRequestException);
  });
});
