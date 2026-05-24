import { promises as fs } from 'fs';
import * as path from 'path';
import { Writable } from 'stream';
import { BadRequestException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { FileStorageService } from '../services/file-storage.service';
import type { UploadedCvFile } from '../types/uploaded-cv-file';

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: jest.fn(),
      destroy: jest.fn(),
    },
  },
}));

jest.mock('crypto', () => ({
  randomUUID: jest.fn(() => '550e8400-e29b-41d4-a716-446655440000'),
}));

describe('FileStorageService', () => {
  const environmentService = {
    cloudinaryCloudName: 'nyx-test',
    cloudinaryApiKey: 'cloudinary-key',
    cloudinaryApiSecret: 'cloudinary-secret',
    cloudinaryCvFolder: 'nyx/cvs',
  };
  const service = new FileStorageService(environmentService as never);
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
      storageProvider: 'local',
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

  it('uploads CV files to Cloudinary using signed server credentials', async () => {
    jest
      .mocked(cloudinary.uploader.upload_stream)
      .mockImplementation((options, callback) => {
        const stream = new Writable({
          write(_chunk, _encoding, done) {
            done();
          },
        });
        stream.on('finish', () => {
          callback?.(undefined, {
            public_id:
              'nyx/cvs/43a84c6a-4bcf-47c1-a1e1-215ba79c9404/cloudinary-resume',
            secure_url:
              'https://res.cloudinary.com/nyx-test/raw/upload/nyx/cvs/cloudinary-resume.pdf',
          });
        });

        return stream as never;
      });

    const file = {
      originalname: 'Resume.pdf',
      buffer: Buffer.from('PDF content'),
    } satisfies UploadedCvFile;

    const result = await service.uploadCloudinary(userId, file);

    expect(cloudinary.config).toHaveBeenCalledWith({
      cloud_name: 'nyx-test',
      api_key: 'cloudinary-key',
      api_secret: 'cloudinary-secret',
      secure: true,
    });
    expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
      expect.objectContaining({
        folder: 'nyx/cvs',
        public_id:
          '43a84c6a-4bcf-47c1-a1e1-215ba79c9404/1779455400000-550e8400-e29b-41d4-a716-446655440000-Resume.pdf',
        resource_type: 'raw',
      }),
      expect.any(Function),
    );
    expect(result).toEqual({
      storageProvider: 'cloudinary',
      storageKey:
        'nyx/cvs/43a84c6a-4bcf-47c1-a1e1-215ba79c9404/cloudinary-resume',
      storageUrl:
        'https://res.cloudinary.com/nyx-test/raw/upload/nyx/cvs/cloudinary-resume.pdf',
    });
  });

  it('destroys Cloudinary raw assets by public id', async () => {
    jest.mocked(cloudinary.uploader.destroy).mockResolvedValue({});

    await service.deleteFile('nyx/cvs/user-id/resume', 'cloudinary');

    expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(
      'nyx/cvs/user-id/resume',
      { resource_type: 'raw' },
    );
  });
});
