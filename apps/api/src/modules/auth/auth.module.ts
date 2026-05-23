import { Module } from '@nestjs/common';
import { EnvironmentService } from '../../config/environment.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';

@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    EnvironmentService,
    JwtAuthGuard,
    PasswordService,
    TokenService,
  ],
  exports: [JwtAuthGuard, TokenService],
})
export class AuthModule {}
