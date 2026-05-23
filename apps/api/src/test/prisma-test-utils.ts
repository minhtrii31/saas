import { promises as fs } from 'fs';
import * as path from 'path';
import { INestApplication } from '@nestjs/common';
import { getStorageToken } from '@nestjs/throttler';
import { PrismaService } from '../prisma/prisma.service';
import { requireTestDatabaseUrl } from './integration-test-app';

type ResettableThrottlerStorage = {
  onApplicationShutdown(): void;
  storage: Map<string, unknown>;
  timeoutIds?: Map<string, ReturnType<typeof setTimeout>[]>;
};

export async function resetTestDatabase(prisma: PrismaService): Promise<void> {
  requireTestDatabaseUrl();

  await removeLocalUploadFiles(prisma);
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "usage_records", "cv_analyses", "applications", "job_targets", "cvs", "users" RESTART IDENTITY CASCADE',
  );
}

export function resetTestThrottlerStorage(app: INestApplication): void {
  requireTestDatabaseUrl();

  const storage = app.get<ResettableThrottlerStorage>(getStorageToken());
  storage.onApplicationShutdown();
  storage.timeoutIds?.clear();
  storage.storage.clear();
}

async function removeLocalUploadFiles(prisma: PrismaService): Promise<void> {
  const cvs = await prisma.cv.findMany({
    where: {
      storageProvider: 'local',
    },
    select: {
      storageKey: true,
    },
  });

  await Promise.all(
    cvs.map(async ({ storageKey }) => {
      const filePath = resolveLocalUploadPath(storageKey);
      if (!filePath) {
        return;
      }

      await fs.unlink(filePath).catch(() => undefined);
    }),
  );
}

function resolveLocalUploadPath(storageKey: string): string | null {
  const normalizedKey = storageKey.replace(/\\/g, '/');
  const segments = normalizedKey.split('/');

  if (
    path.isAbsolute(storageKey) ||
    normalizedKey.length === 0 ||
    normalizedKey.includes('\0') ||
    segments.some((segment) => segment === '..' || segment.length === 0)
  ) {
    return null;
  }

  const uploadRoot = path.resolve(process.cwd(), 'uploads');
  const filePath = path.resolve(uploadRoot, normalizedKey);
  const relativePath = path.relative(uploadRoot, filePath);

  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    return null;
  }

  return filePath;
}
