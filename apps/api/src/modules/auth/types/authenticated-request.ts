import { Request } from 'express';

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
};

export type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
};
