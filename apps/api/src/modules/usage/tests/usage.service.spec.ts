import { Test } from '@nestjs/testing';
import { EnvironmentService } from '../../../config/environment.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { UsageService } from '../usage.service';

describe('UsageService', () => {
  const originalJwtSecret = process.env.JWT_SECRET;
  const originalCvAnalysisCost = process.env.USAGE_COST_CV_ANALYSIS;
  let usageService: UsageService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      updateMany: jest.Mock;
    };
    usageRecord: {
      create: jest.Mock;
    };
  };

  beforeEach(async () => {
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.USAGE_COST_CV_ANALYSIS = '2';
    prisma = {
      user: {
        findUnique: jest.fn(),
        updateMany: jest.fn(),
      },
      usageRecord: {
        create: jest.fn(),
      },
    };

    const module = await Test.createTestingModule({
      providers: [EnvironmentService, UsageService, PrismaService],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    usageService = module.get(UsageService);
  });

  afterEach(() => {
    restoreEnv('JWT_SECRET', originalJwtSecret);
    restoreEnv('USAGE_COST_CV_ANALYSIS', originalCvAnalysisCost);
  });

  it('throws INSUFFICIENT_CREDITS when the user does not have enough credits', async () => {
    prisma.user.findUnique.mockResolvedValue({ creditBalance: 1 });

    await expect(
      usageService.checkCredits(
        '43a84c6a-4bcf-47c1-a1e1-215ba79c9404',
        'CV_ANALYSIS',
      ),
    ).rejects.toMatchObject({
      response: {
        error: {
          code: 'INSUFFICIENT_CREDITS',
          message: 'Insufficient credits',
        },
        meta: {},
      },
      status: 402,
    });
  });

  it('deducts credits and persists a usage record', async () => {
    prisma.user.updateMany.mockResolvedValue({ count: 1 });
    prisma.usageRecord.create.mockResolvedValue({
      id: '4f610e89-b632-4f1b-b0f2-d3b5f428f93d',
    });

    await usageService.consumeCredits(
      '43a84c6a-4bcf-47c1-a1e1-215ba79c9404',
      'CV_ANALYSIS',
      {
        cvAnalysisId: '2f8d69b3-9274-496d-a9a4-2df643f0fe9a',
      },
    );

    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: {
        id: '43a84c6a-4bcf-47c1-a1e1-215ba79c9404',
        deletedAt: null,
        creditBalance: {
          gte: 2,
        },
      },
      data: {
        creditBalance: {
          decrement: 2,
        },
      },
    });
    expect(prisma.usageRecord.create).toHaveBeenCalledWith({
      data: {
        userId: '43a84c6a-4bcf-47c1-a1e1-215ba79c9404',
        action: 'CV_ANALYSIS',
        creditsUsed: 2,
        cvAnalysisId: '2f8d69b3-9274-496d-a9a4-2df643f0fe9a',
      },
    });
  });
});

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}
