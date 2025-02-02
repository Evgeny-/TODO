import { NextFunction, Request, Response } from 'express';
import { BaseCustomError, HttpStatusCode } from './errors';

export type ErrorResponse = {
  error: string;
  stack?: string;
};

export function expressErrorHandler(
  err: BaseCustomError | Error,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const statusCode =
    err instanceof BaseCustomError
      ? err.details.clientHttpStatus || HttpStatusCode.INTERNAL_SERVER_ERROR
      : HttpStatusCode.INTERNAL_SERVER_ERROR;

  console.error(err);

  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
  });
}
