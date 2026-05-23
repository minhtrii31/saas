import { Module } from '@nestjs/common';
import { EnvironmentService } from '../../config/environment.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { UsageService } from './usage.service';

@Module({
  imports: [PrismaModule],
  providers: [EnvironmentService, UsageService],
  exports: [UsageService],
})
export class UsageModule {}
