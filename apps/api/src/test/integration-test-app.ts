import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { configureApp } from '../app.setup';

export async function createIntegrationTestApp(): Promise<INestApplication> {
  requireTestDatabaseUrl();

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  configureApp(app);
  await app.init();

  return app;
}

export function requireTestDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;
  const explicitTestDatabaseUrl = process.env.DATABASE_URL_TEST;

  if (!explicitTestDatabaseUrl || !databaseUrl) {
    throw new Error(
      'DATABASE_URL_TEST is required for PostgreSQL integration tests.',
    );
  }

  if (databaseUrl !== explicitTestDatabaseUrl) {
    throw new Error('Integration tests must run against DATABASE_URL_TEST.');
  }

  const developmentDatabaseUrl = process.env.API_DEVELOPMENT_DATABASE_URL;
  if (developmentDatabaseUrl && databaseUrl === developmentDatabaseUrl) {
    throw new Error('DATABASE_URL_TEST must not match the dev DATABASE_URL.');
  }

  const parsedUrl = new URL(databaseUrl);
  const databaseName = parsedUrl.pathname.replace(/^\//, '');
  if (!/(^|[_-])test($|[_-])/i.test(databaseName)) {
    throw new Error(
      `Refusing to run integration tests against non-test database "${databaseName}".`,
    );
  }

  return databaseUrl;
}
