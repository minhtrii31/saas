import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-request';
import { CvsService } from './cvs.service';
import { CreateCvDto } from './dto/create-cv.dto';
import type { UploadedCvFile } from './types/uploaded-cv-file';

const cvIdParamPipe = new ParseUUIDPipe({
  exceptionFactory: () =>
    new BadRequestException({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed (uuid is expected)',
      },
      meta: {},
    }),
});

@Controller('cvs')
export class CvsController {
  constructor(private readonly cvsService: CvsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  findMany(@CurrentUser() user: AuthenticatedUser) {
    return this.cvsService.findMany(user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', cvIdParamPipe) id: string,
  ) {
    return this.cvsService.findOne(user.id, id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', cvIdParamPipe) id: string,
  ) {
    return this.cvsService.remove(user.id, id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCvDto) {
    return this.cvsService.create(user.id, dto);
  }

  @Post(':id/analyze')
  @UseGuards(JwtAuthGuard)
  analyze(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', cvIdParamPipe) id: string,
  ) {
    return this.cvsService.analyze(user.id, id);
  }

  @Post('upload')
  @HttpCode(201)
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: UploadedCvFile | undefined,
    @Body('title') title?: string,
  ) {
    return this.cvsService.uploadFile(user.id, file, title);
  }
}
