import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { JobTargetsController } from './job-targets.controller';
import { JobTargetsService } from './job-targets.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [JobTargetsController],
  providers: [JobTargetsService],
})
export class JobTargetsModule {}
