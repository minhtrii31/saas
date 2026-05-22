import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';

export const cvNotFound = (): NotFoundException =>
  new NotFoundException({
    error: {
      code: 'CV_NOT_FOUND',
      message: 'CV not found',
    },
    meta: {},
  });

export const cvTextNotExtracted = (): UnprocessableEntityException =>
  new UnprocessableEntityException({
    error: {
      code: 'CV_TEXT_NOT_EXTRACTED',
      message: 'CV text has not been extracted',
    },
    meta: {},
  });
