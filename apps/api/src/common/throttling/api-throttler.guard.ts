import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

type ThrottledRequest = {
  ip?: string;
  user?: {
    id?: string;
  };
};

@Injectable()
export class ApiThrottlerGuard extends ThrottlerGuard {
  protected getTracker(request: ThrottledRequest): Promise<string> {
    return Promise.resolve(request.user?.id ?? request.ip ?? 'unknown');
  }
}
