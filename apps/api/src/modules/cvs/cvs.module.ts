import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { CvsController } from './cvs.controller';
import { CvsService } from './cvs.service';
import { FileStorageService } from './services/file-storage.service';
import { EnvironmentService } from '../../config/environment.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [CvsController],
  providers: [CvsService, FileStorageService, EnvironmentService],
})
export class CvsModule {}
