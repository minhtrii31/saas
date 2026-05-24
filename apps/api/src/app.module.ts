import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ApiExceptionFilter } from './common/api-exception.filter';
import { ApiResponseInterceptor } from './common/api-response.interceptor';
import { ApiThrottlingModule } from './common/throttling/throttling.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EnvironmentService } from './config/environment.service';
import { ApplicationsModule } from './modules/applications/applications.module';
import { AuthModule } from './modules/auth/auth.module';
import { CvsModule } from './modules/cvs/cvs.module';
import { HealthModule } from './modules/health/health.module';
import { JobTargetsModule } from './modules/job-targets/job-targets.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ApiThrottlingModule,
    PrismaModule,
    AuthModule,
    CvsModule,
    HealthModule,
    JobTargetsModule,
    ApplicationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    EnvironmentService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ApiResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: ApiExceptionFilter,
    },
  ],
})
export class AppModule {}
