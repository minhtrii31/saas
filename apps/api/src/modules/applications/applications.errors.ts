import { NotFoundException } from '@nestjs/common';

export function applicationNotFound() {
  return new NotFoundException({
    error: {
      code: 'APPLICATION_NOT_FOUND',
      message: 'Application not found',
    },
    meta: {},
  });
}
