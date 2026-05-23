import { Injectable } from '@nestjs/common';
import { Prisma, type UsageAction } from '@prisma/client';
import { EnvironmentService } from '../../config/environment.service';
import { PrismaService } from '../../prisma/prisma.service';
import { insufficientCredits } from './usage.errors';

type UsageTransaction = Prisma.TransactionClient;

@Injectable()
export class UsageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly environmentService: EnvironmentService,
  ) {}

  getActionCost(action: UsageAction): number {
    return this.environmentService.usageCosts[action] ?? 1;
  }

  async checkCredits(userId: string, action: UsageAction): Promise<void> {
    const remainingCredits = await this.getRemainingCredits(userId);
    const creditsRequired = this.getActionCost(action);

    if (remainingCredits < creditsRequired) {
      throw insufficientCredits();
    }
  }

  async consumeCredits(
    userId: string,
    action: UsageAction,
    options: {
      tx?: UsageTransaction;
      cvAnalysisId?: string;
    } = {},
  ): Promise<void> {
    const tx = options.tx ?? this.prisma;
    const creditsUsed = this.getActionCost(action);

    if (creditsUsed === 0) {
      await tx.usageRecord.create({
        data: {
          userId,
          action,
          creditsUsed,
          cvAnalysisId: options.cvAnalysisId,
        },
      });
      return;
    }

    const updated = await tx.user.updateMany({
      where: {
        id: userId,
        deletedAt: null,
        creditBalance: {
          gte: creditsUsed,
        },
      },
      data: {
        creditBalance: {
          decrement: creditsUsed,
        },
      },
    });

    if (updated.count !== 1) {
      throw insufficientCredits();
    }

    await tx.usageRecord.create({
      data: {
        userId,
        action,
        creditsUsed,
        cvAnalysisId: options.cvAnalysisId,
      },
    });
  }

  async getRemainingCredits(userId: string): Promise<number> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        creditBalance: true,
      },
    });

    return user?.creditBalance ?? 0;
  }
}
