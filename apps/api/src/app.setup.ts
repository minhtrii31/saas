import {
  BadRequestException,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { ValidationError } from 'class-validator';

export function configureApp(app: INestApplication): void {
  app.enableCors({
    origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  app.useGlobalPipes(createValidationPipe());
}

export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errors: ValidationError[]) =>
      new BadRequestException({
        error: {
          code: 'VALIDATION_ERROR',
          message: getFirstValidationMessage(errors),
        },
        meta: {},
      }),
  });
}

function getFirstValidationMessage(errors: ValidationError[]): string {
  for (const error of errors) {
    const message = findFirstConstraintMessage(error);

    if (message) {
      return message;
    }
  }

  return 'Validation failed';
}

function findFirstConstraintMessage(error: ValidationError): string | null {
  const constraints = error.constraints;

  if (constraints) {
    const message = firstConstraintMessage(constraints);

    if (message) {
      return message;
    }
  }

  for (const child of error.children ?? []) {
    const message = findFirstConstraintMessage(child);

    if (message) {
      return message;
    }
  }

  return null;
}

function firstConstraintMessage(
  constraints: Record<string, string>,
): string | null {
  if (constraints.isNotEmpty) {
    return constraints.isNotEmpty;
  }

  const [message] = Object.values(constraints);

  return message ?? null;
}
