export type JobTargetItem = {
  id: string;
  userId: string;
  title: string;
  companyName: string;
  jobDescriptionText: string;
  createdAt: Date;
  updatedAt: Date;
};

export type DeletedJobTarget = {
  id: string;
  deletedAt: Date;
};

export const jobTargetSelect = {
  id: true,
  userId: true,
  title: true,
  companyName: true,
  jobDescriptionText: true,
  createdAt: true,
  updatedAt: true,
};
