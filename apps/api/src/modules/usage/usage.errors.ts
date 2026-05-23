import { HttpException, HttpStatus } from '@nestjs/common';

export const insufficientCredits = (): HttpException =>
  new HttpException(
    {
      error: {
        code: 'INSUFFICIENT_CREDITS',
        message: 'Insufficient credits',
      },
      meta: {},
    },
    HttpStatus.PAYMENT_REQUIRED,
  );
