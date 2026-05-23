import { Global, Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ApiThrottlerGuard } from './api-throttler.guard';

@Global()
@Module({
  imports: [
    ThrottlerModule.forRoot({
      errorMessage: 'Too many requests',
      throttlers: [
        {
          name: 'default',
          ttl: 60_000,
          limit: 1_000,
        },
      ],
    }),
  ],
  providers: [ApiThrottlerGuard],
  exports: [ApiThrottlerGuard],
})
export class ApiThrottlingModule {}
