import { applyDecorators, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiThrottlerGuard } from './api-throttler.guard';

export const rateLimitWindowMs = 60_000;

export const rateLimits = {
  authLogin: {
    limit: 5,
    ttl: rateLimitWindowMs,
  },
  authRegister: {
    limit: 5,
    ttl: rateLimitWindowMs,
  },
  cvUpload: {
    limit: 10,
    ttl: rateLimitWindowMs,
  },
  cvAnalyze: {
    limit: 10,
    ttl: rateLimitWindowMs,
  },
  cvMatch: {
    limit: 10,
    ttl: rateLimitWindowMs,
  },
  cvCoverLetter: {
    limit: 10,
    ttl: rateLimitWindowMs,
  },
  cvInterviewPrep: {
    limit: 10,
    ttl: rateLimitWindowMs,
  },
  cvRewrite: {
    limit: 10,
    ttl: rateLimitWindowMs,
  },
  applicationFollowUp: {
    limit: 10,
    ttl: rateLimitWindowMs,
  },
} as const;

type RateLimitName = keyof typeof rateLimits;

export function RateLimit(name: RateLimitName): MethodDecorator {
  const config = rateLimits[name];

  return applyDecorators(
    UseGuards(ApiThrottlerGuard),
    Throttle({
      default: {
        limit: config.limit,
        ttl: config.ttl,
      },
    }),
  );
}
