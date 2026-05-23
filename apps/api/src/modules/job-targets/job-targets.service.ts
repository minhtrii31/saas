import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateJobTargetDto } from './dto/create-job-target.dto';
import { UpdateJobTargetDto } from './dto/update-job-target.dto';
import { jobTargetNotFound } from './job-targets.errors';
import {
  DeletedJobTarget,
  JobTargetItem,
  jobTargetSelect,
} from './job-targets.types';

@Injectable()
export class JobTargetsService {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(
    userId: string,
  ): Promise<{ data: JobTargetItem[]; meta: Record<string, never> }> {
    const targets = await this.prisma.jobTarget.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      select: jobTargetSelect,
    });

    return {
      data: targets,
      meta: {},
    };
  }

  async create(
    userId: string,
    dto: CreateJobTargetDto,
  ): Promise<{ data: JobTargetItem; meta: Record<string, never> }> {
    const target = await this.prisma.jobTarget.create({
      data: {
        userId,
        title: dto.title,
        companyName: dto.companyName,
        jobDescriptionText: dto.jobDescriptionText,
        deletedAt: null,
      },
      select: jobTargetSelect,
    });

    return {
      data: target,
      meta: {},
    };
  }

  async findOne(
    userId: string,
    id: string,
  ): Promise<{ data: JobTargetItem; meta: Record<string, never> }> {
    const target = await this.findOwned(userId, id);

    if (!target) {
      throw jobTargetNotFound();
    }

    return {
      data: target,
      meta: {},
    };
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateJobTargetDto,
  ): Promise<{ data: JobTargetItem; meta: Record<string, never> }> {
    const result = await this.prisma.jobTarget.updateMany({
      where: {
        id,
        userId,
        deletedAt: null,
      },
      data: dto,
    });

    if (result.count === 0) {
      throw jobTargetNotFound();
    }

    const target = await this.findOwned(userId, id);

    if (!target) {
      throw jobTargetNotFound();
    }

    return {
      data: target,
      meta: {},
    };
  }

  async remove(
    userId: string,
    id: string,
  ): Promise<{ data: DeletedJobTarget; meta: Record<string, never> }> {
    const deletedAt = new Date();
    const result = await this.prisma.jobTarget.updateMany({
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
      throw jobTargetNotFound();
    }

    return {
      data: {
        id,
        deletedAt,
      },
      meta: {},
    };
  }

  private async findOwned(
    userId: string,
    id: string,
  ): Promise<JobTargetItem | null> {
    return this.prisma.jobTarget.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
      select: jobTargetSelect,
    });
  }
}
