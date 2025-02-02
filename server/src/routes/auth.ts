import { Router } from 'express';
import { Request, Response } from 'express';
import {
  authenticateOrCreateUser,
  authSchema,
} from '../controllers/auth-controller.js';
import { assertSchema } from '../utils/asserts.js';
import { z } from 'zod';
import { User } from '@prisma/client';

export const authRouter = Router();

export type AuthRequest = z.infer<typeof authSchema>;
export type AuthResponse = {
  token: string;
  user: User;
};

authRouter.post('/', async (req: Request, res: Response) => {
  assertSchema(req.body, authSchema);

  res.json((await authenticateOrCreateUser(req.body)) satisfies AuthResponse);
});
