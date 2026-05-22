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
import type { Request } from 'express';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-request';
import { CvsService } from './cvs.service';
import { CreateCvDto } from './dto/create-cv.dto';
import { GenerateCoverLetterDto } from './dto/generate-cover-letter.dto';
import { MatchCvDto } from './dto/match-cv.dto';
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

const defaultCvMaxFileSizeBytes = 5242880;
const cvMaxFileSizeBytes = Number.isSafeInteger(
  Number(process.env.CV_MAX_FILE_SIZE_BYTES),
)
  ? Number(process.env.CV_MAX_FILE_SIZE_BYTES)
  : defaultCvMaxFileSizeBytes;

const uploadValidationError = (message: string) =>
  new BadRequestException({
    error: {
      code: 'VALIDATION_ERROR',
      message,
    },
    meta: {},
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

  @Get(':id/analyses')
  @UseGuards(JwtAuthGuard)
  findAnalyses(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', cvIdParamPipe) id: string,
  ) {
    return this.cvsService.findAnalyses(user.id, id);
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

  @Post(':id/match')
  @UseGuards(JwtAuthGuard)
  match(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', cvIdParamPipe) id: string,
    @Body() dto: MatchCvDto,
  ) {
    return this.cvsService.matchJobDescription(user.id, id, dto);
  }

  @Post(':id/cover-letter')
  @UseGuards(JwtAuthGuard)
  generateCoverLetter(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', cvIdParamPipe) id: string,
    @Body() dto: GenerateCoverLetterDto,
  ) {
    return this.cvsService.generateCoverLetter(user.id, id, dto);
  }

  @Post('upload')
  @HttpCode(201)
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: cvMaxFileSizeBytes,
        files: 1,
      },
      fileFilter: (
        _request: Request,
        file: { mimetype: string },
        callback: (error: Error | null, acceptFile: boolean) => void,
      ) => {
        const supportedMimeTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];

        if (!supportedMimeTypes.includes(file.mimetype)) {
          callback(
            uploadValidationError(
              'Only PDF, DOC, and DOCX files are supported',
            ),
            false,
          );
          return;
        }

        callback(null, true);
      },
    }),
  )
  async upload(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: UploadedCvFile | undefined,
    @Body('title') title?: string,
  ) {
    return this.cvsService.uploadFile(user.id, file, title);
  }
}
