import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db } from '../db';
import { JWT_SECRET } from '../env';
import { Request, Response, NextFunction } from 'express';
import { ensureTruthy } from '../utils/asserts';
import { HttpStatusCode, ValidationError } from '../utils/errors';

export type JwtPayload = {
  userId: string;
  name: string;
};

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export const authSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});

export async function authenticateOrCreateUser(data: { name: string }) {
  let user = await db.user.findUnique({
    where: { name: data.name },
  });

  if (!user) {
    user = await db.user.create({ data });
  }

  const payload: JwtPayload = { userId: user.id, name: user.name };

  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: '1y',
  });

  return {
    token,
    user,
  };
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  const authHeader = ensureTruthy(
    req.headers.authorization,
    'Not authenticated',
    { clientHttpStatus: HttpStatusCode.UNAUTHORIZED },
  );

  const token = authHeader.replace('Bearer ', '');

  try {
    const payload = validateJwtToken(token);
    res.locals.user = { userId: payload.userId, name: payload.name };
    next();
  } catch (err) {
    throw new ValidationError('Invalid token');
  }
}

export function validateJwtToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}
