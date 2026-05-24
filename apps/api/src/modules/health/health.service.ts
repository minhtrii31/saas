import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type HealthStatus = {
  status: 'ok';
};

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async getStatus(): Promise<HealthStatus> {
    await this.prisma.$queryRaw`SELECT 1`;

    return {
      status: 'ok',
    };
  }
}
