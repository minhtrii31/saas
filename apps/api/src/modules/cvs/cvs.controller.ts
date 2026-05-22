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
import type { Multer } from 'multer';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-request';
import { CvsService } from './cvs.service';
import { CreateCvDto, supportedCvMimeTypes } from './dto/create-cv.dto';
import { EnvironmentService } from '../../config/environment.service';

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
  constructor(
    private readonly cvsService: CvsService,
    private readonly environmentService: EnvironmentService,
  ) {}

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

  @Post('upload')
  @HttpCode(201)
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @CurrentUser() user: AuthenticatedUser,
    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    @UploadedFile() file: Multer.File | undefined,
    @Body('title') title?: string,
  ) {
    // Validate file exists
    if (!file) {
      throw new BadRequestException({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'File is required',
        },
        meta: {},
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const mimeType: string = file.mimetype ?? '';
    // Validate MIME type
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    if (!supportedCvMimeTypes.includes(mimeType as any)) {
      throw new BadRequestException({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Only PDF, DOC, and DOCX files are supported',
        },
        meta: {},
      });
    }

    // Validate file size
    const maxFileSize = this.environmentService.optionalInt(
      'CV_MAX_FILE_SIZE_BYTES',
      5242880,
    );
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const fileSize: number = file.size ?? 0;
    if (fileSize > maxFileSize) {
      const maxSizeMb = Math.round(maxFileSize / 1024 / 1024);
      throw new BadRequestException({
        error: {
          code: 'VALIDATION_ERROR',
          message: `File size exceeds maximum of ${maxSizeMb} MB`,
        },
        meta: {},
      });
    }

    // Upload file and create CV record
    return this.cvsService.uploadFile(user.id, file, title);
  }
}
