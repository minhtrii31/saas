import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';

type ApiSuccessBody<T> = {
  data: T;
  meta: Record<string, never>;
};

type ExistingApiSuccessBody<T> = {
  data: T;
  meta?: Record<string, never>;
};

@Injectable()
export class ApiResponseInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiSuccessBody<unknown>> {
    return next.handle().pipe(map((body: unknown) => this.toSuccessBody(body)));
  }

  private toSuccessBody(body: unknown): ApiSuccessBody<unknown> {
    if (this.isExistingSuccessBody(body)) {
      return {
        data: body.data,
        meta: body.meta ?? {},
      };
    }

    return {
      data: body,
      meta: {},
    };
  }

  private isExistingSuccessBody(
    body: unknown,
  ): body is ExistingApiSuccessBody<unknown> {
    return (
      typeof body === 'object' &&
      body !== null &&
      'data' in body &&
      !('error' in body)
    );
  }
}
