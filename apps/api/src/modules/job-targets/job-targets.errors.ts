import { NotFoundException } from '@nestjs/common';

export const jobTargetNotFound = (): NotFoundException =>
  new NotFoundException({
    error: {
      code: 'JOB_TARGET_NOT_FOUND',
      message: 'Job target not found',
    },
    meta: {},
  });
