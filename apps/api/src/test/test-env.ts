import { existsSync } from 'fs';
import { resolve } from 'path';
import { config } from 'dotenv';

const configuredFlag = 'API_TEST_ENV_CONFIGURED';

export function configureApiTestEnv(): void {
  if (process.env[configuredFlag] === 'true') {
    return;
  }

  config({ path: resolve(process.cwd(), '.env') });
  const developmentDatabaseUrl = process.env.DATABASE_URL;

  const localTestEnvPath = resolve(process.cwd(), '.env.test.local');
  if (existsSync(localTestEnvPath)) {
    config({ path: localTestEnvPath, override: true });
  }

  process.env.API_DEVELOPMENT_DATABASE_URL = developmentDatabaseUrl ?? '';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
  process.env.AI_PROVIDER = 'mock';
  process.env.STORAGE_PROVIDER = 'local';
  delete process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_MODEL;
  delete process.env.CLOUDINARY_CLOUD_NAME;
  delete process.env.CLOUDINARY_API_KEY;
  delete process.env.CLOUDINARY_API_SECRET;
  delete process.env.CLOUDINARY_CV_FOLDER;

  if (process.env.DATABASE_URL_TEST) {
    process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
  }

  process.env[configuredFlag] = 'true';
}
