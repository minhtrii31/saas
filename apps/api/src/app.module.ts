import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ApiExceptionFilter } from './common/api-exception.filter';
import { ApiResponseInterceptor } from './common/api-response.interceptor';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EnvironmentService } from './config/environment.service';
import { AuthModule } from './modules/auth/auth.module';
import { CvsModule } from './modules/cvs/cvs.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, AuthModule, CvsModule],
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
