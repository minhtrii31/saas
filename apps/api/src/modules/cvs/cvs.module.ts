import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { CvsController } from './cvs.controller';
import { CvsService } from './cvs.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [CvsController],
  providers: [CvsService],
})
export class CvsModule {}
