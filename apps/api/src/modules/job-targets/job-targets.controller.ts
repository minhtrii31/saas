import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-request';
import { CreateJobTargetDto } from './dto/create-job-target.dto';
import { UpdateJobTargetDto } from './dto/update-job-target.dto';
import { JobTargetsService } from './job-targets.service';

const jobTargetIdParamPipe = new ParseUUIDPipe({
  exceptionFactory: () =>
    new BadRequestException({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed (uuid is expected)',
      },
      meta: {},
    }),
});

@Controller('job-targets')
@UseGuards(JwtAuthGuard)
export class JobTargetsController {
  constructor(private readonly jobTargetsService: JobTargetsService) {}

  @Get()
  findMany(@CurrentUser() user: AuthenticatedUser) {
    return this.jobTargetsService.findMany(user.id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateJobTargetDto,
  ) {
    return this.jobTargetsService.create(user.id, dto);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', jobTargetIdParamPipe) id: string,
  ) {
    return this.jobTargetsService.findOne(user.id, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', jobTargetIdParamPipe) id: string,
    @Body() dto: UpdateJobTargetDto,
  ) {
    return this.jobTargetsService.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', jobTargetIdParamPipe) id: string,
  ) {
    return this.jobTargetsService.remove(user.id, id);
  }
}
