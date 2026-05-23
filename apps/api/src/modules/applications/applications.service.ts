import { Injectable } from '@nestjs/common';
import { ApplicationStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalysisService } from '../analysis/analysis.service';
import { cvNotFound, cvTextNotExtracted } from '../cvs/cvs.errors';
import { jobTargetNotFound } from '../job-targets/job-targets.errors';
import { UsageService } from '../usage/usage.service';
import { applicationNotFound } from './applications.errors';
import {
  applicationSelect,
  type ApplicationItem,
  type DeletedApplication,
  type FollowUpDraft,
} from './applications.types';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly analysisService: AnalysisService,
    private readonly usageService: UsageService,
  ) {}

  async findMany(
    userId: string,
  ): Promise<{ data: ApplicationItem[]; meta: Record<string, never> }> {
    const applications = await this.prisma.application.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      select: applicationSelect,
    });

    return { data: applications, meta: {} };
  }

  async create(
    userId: string,
    dto: CreateApplicationDto,
  ): Promise<{ data: ApplicationItem; meta: Record<string, never> }> {
    await this.ensureOwnedCv(userId, dto.cvId);
    await this.ensureOwnedJobTarget(userId, dto.jobTargetId);

    const application = await this.prisma.application.create({
      data: {
        userId,
        cvId: dto.cvId,
        jobTargetId: dto.jobTargetId,
        companyName: dto.companyName,
        roleTitle: dto.roleTitle,
        status: dto.status ?? ApplicationStatus.SAVED,
        appliedAt: dto.appliedAt ? new Date(dto.appliedAt) : null,
        notes: dto.notes ?? null,
        deletedAt: null,
      },
      select: applicationSelect,
    });

    return { data: application, meta: {} };
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateApplicationDto,
  ): Promise<{ data: ApplicationItem; meta: Record<string, never> }> {
    await this.ensureOwnedApplication(userId, id);

    if (dto.cvId) {
      await this.ensureOwnedCv(userId, dto.cvId);
    }

    if (dto.jobTargetId) {
      await this.ensureOwnedJobTarget(userId, dto.jobTargetId);
    }

    const updated = await this.prisma.application.updateMany({
      where: {
        id,
        userId,
        deletedAt: null,
      },
      data: {
        cvId: dto.cvId,
        jobTargetId: dto.jobTargetId,
        companyName: dto.companyName,
        roleTitle: dto.roleTitle,
        status: dto.status,
        appliedAt:
          dto.appliedAt === undefined
            ? undefined
            : dto.appliedAt === null
              ? null
              : new Date(dto.appliedAt),
        notes: dto.notes,
      },
    });

    if (updated.count === 0) {
      throw applicationNotFound();
    }

    const application = await this.findOwned(userId, id);
    if (!application) {
      throw applicationNotFound();
    }

    return { data: application, meta: {} };
  }

  async remove(
    userId: string,
    id: string,
  ): Promise<{ data: DeletedApplication; meta: Record<string, never> }> {
    const deletedAt = new Date();
    const result = await this.prisma.application.updateMany({
      where: {
        id,
        userId,
        deletedAt: null,
      },
      data: {
        deletedAt,
      },
    });

    if (result.count === 0) {
      throw applicationNotFound();
    }

    return { data: { id, deletedAt }, meta: {} };
  }

  async generateFollowUp(
    userId: string,
    id: string,
  ): Promise<{ data: FollowUpDraft; meta: Record<string, never> }> {
    const application = await this.findOwned(userId, id);

    if (!application) {
      throw applicationNotFound();
    }

    const cv = await this.prisma.cv.findFirst({
      where: {
        id: application.cvId,
        userId,
        deletedAt: null,
      },
      select: {
        id: true,
        extractedText: true,
      },
    });

    if (!cv) {
      throw cvNotFound();
    }

    if (!cv.extractedText?.trim()) {
      throw cvTextNotExtracted();
    }

    await this.usageService.checkCredits(userId, 'APPLICATION_FOLLOW_UP');
    const followUp = await this.analysisService.generateApplicationFollowUp(
      cv.extractedText,
      {
        companyName: application.companyName,
        roleTitle: application.roleTitle,
        status: application.status,
        appliedAt: application.appliedAt?.toISOString(),
        notes: application.notes ?? undefined,
      },
    );

    const analysis = await this.prisma.$transaction(async (tx) => {
      const created = await tx.cvAnalysis.create({
        data: {
          cvId: cv.id,
          type: 'APPLICATION_FOLLOW_UP',
          aiProvider: followUp.aiProvider,
          aiModel: followUp.aiModel,
          result: {
            applicationId: application.id,
            ...followUp.result,
          },
        },
        select: {
          id: true,
        },
      });

      await this.usageService.consumeCredits(userId, 'APPLICATION_FOLLOW_UP', {
        tx,
        cvAnalysisId: created.id,
      });

      return created;
    });

    return {
      data: {
        applicationId: application.id,
        draft: followUp.result.draft,
        tone: followUp.result.tone,
        status: application.status,
        analysisId: analysis.id,
      },
      meta: {},
    };
  }

  private async findOwned(
    userId: string,
    id: string,
  ): Promise<ApplicationItem | null> {
    return this.prisma.application.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
      select: applicationSelect,
    });
  }

  private async ensureOwnedApplication(
    userId: string,
    id: string,
  ): Promise<void> {
    const application = await this.prisma.application.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!application) {
      throw applicationNotFound();
    }
  }

  private async ensureOwnedCv(userId: string, cvId: string): Promise<void> {
    const cv = await this.prisma.cv.findFirst({
      where: {
        id: cvId,
        userId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!cv) {
      throw cvNotFound();
    }
  }

  private async ensureOwnedJobTarget(
    userId: string,
    jobTargetId: string | undefined,
  ): Promise<void> {
    if (!jobTargetId) {
      return;
    }

    const target = await this.prisma.jobTarget.findFirst({
      where: {
        id: jobTargetId,
        userId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!target) {
      throw jobTargetNotFound();
    }
  }
}
