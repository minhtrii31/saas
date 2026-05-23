import type { ApplicationStatus } from '@prisma/client';

export type ApplicationItem = {
  id: string;
  userId: string;
  cvId: string;
  jobTargetId: string | null;
  companyName: string;
  roleTitle: string;
  status: ApplicationStatus;
  appliedAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type DeletedApplication = {
  id: string;
  deletedAt: Date;
};

export type FollowUpDraft = {
  applicationId: string;
  draft: string;
  tone: string;
  status: ApplicationStatus;
  analysisId: string;
};

export const applicationSelect = {
  id: true,
  userId: true,
  cvId: true,
  jobTargetId: true,
  companyName: true,
  roleTitle: true,
  status: true,
  appliedAt: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
};
