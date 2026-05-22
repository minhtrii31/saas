import { INestApplication } from '@nestjs/common';
import { configureApp } from './app.setup';

describe('configureApp', () => {
  const originalWebOrigin = process.env.WEB_ORIGIN;

  afterEach(() => {
    process.env.WEB_ORIGIN = originalWebOrigin;
  });

  it('enables CORS for the default local web origin', () => {
    delete process.env.WEB_ORIGIN;
    const { app, enableCors } = createAppMock();

    configureApp(app);

    expect(enableCors).toHaveBeenCalledWith({
      origin: 'http://localhost:3000',
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });
  });

  it('enables CORS for WEB_ORIGIN when configured', () => {
    process.env.WEB_ORIGIN = 'http://localhost:3001';
    const { app, enableCors } = createAppMock();

    configureApp(app);

    expect(enableCors).toHaveBeenCalledWith(
      expect.objectContaining({
        origin: 'http://localhost:3001',
      }),
    );
  });
});

function createAppMock(): {
  app: INestApplication;
  enableCors: jest.Mock;
} {
  const enableCors = jest.fn();
  const app = {
    enableCors,
    useGlobalPipes: jest.fn(),
  } as unknown as INestApplication;

  return { app, enableCors };
}
