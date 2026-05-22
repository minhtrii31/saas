import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

type ApiErrorBody = {
  error: {
    code: string;
    message: string;
  };
  meta: Record<string, never>;
};

type NestErrorResponse = {
  error?: unknown;
  message?: unknown;
  statusCode?: unknown;
};

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const status = this.getStatus(exception);

    response.status(status).json(this.toErrorBody(exception, status));
  }

  private getStatus(exception: unknown): number {
    return exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private toErrorBody(exception: unknown, status: number): ApiErrorBody {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();

      if (this.isApiErrorBody(response)) {
        return response;
      }

      return {
        error: {
          code: this.toErrorCode(status),
          message: this.toErrorMessage(response, exception.message),
        },
        meta: {},
      };
    }

    return {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
      },
      meta: {},
    };
  }

  private isApiErrorBody(value: unknown): value is ApiErrorBody {
    return (
      typeof value === 'object' &&
      value !== null &&
      'error' in value &&
      typeof (value as NestErrorResponse).error === 'object' &&
      (value as { error: { code?: unknown; message?: unknown } }).error !==
        null &&
      typeof (value as { error: { code?: unknown } }).error.code === 'string' &&
      typeof (value as { error: { message?: unknown } }).error.message ===
        'string'
    );
  }

  private toErrorCode(status: number): string {
    return HttpStatus[status]?.replace(/\s+/g, '_') ?? 'ERROR';
  }

  private toErrorMessage(response: unknown, fallback: string): string {
    if (typeof response === 'string') {
      return response;
    }

    if (typeof response !== 'object' || response === null) {
      return fallback;
    }

    const message = (response as NestErrorResponse).message;

    if (Array.isArray(message)) {
      return String(message[0] ?? fallback);
    }

    if (typeof message === 'string') {
      return message;
    }

    return fallback;
  }
}
