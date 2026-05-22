import { execFileSync } from 'child_process';
import { configureApiTestEnv } from './test-env';

export default function globalSetup(): void {
  configureApiTestEnv();

  if (!process.env.DATABASE_URL_TEST) {
    return;
  }

  execFileSync(
    'npx',
    ['prisma', 'migrate', 'deploy', '--config', 'prisma.config.ts'],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL_TEST,
      },
      stdio: 'inherit',
    },
  );
}
