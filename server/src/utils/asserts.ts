import type { z, ZodError } from 'zod';
import { CustomErrorDetails, HttpStatusCode, ValidationError } from './errors';

export function assert<T>(
  value: T,
  message = 'Assertion failed',
  details?: CustomErrorDetails,
): asserts value {
  if (!value) {
    throw new ValidationError(message, details);
  }
}

export function assertFound<T>(
  value: T | null | undefined,
  message = 'Assertion failed',
  details?: CustomErrorDetails,
): asserts value {
  if (!value) {
    throw new ValidationError(message, {
      clientHttpStatus: HttpStatusCode.NOT_FOUND,
      ...details,
    });
  }
}

export function ensureTruthy<T>(
  value: T | null | undefined,
  message = 'Assertion failed',
  details?: CustomErrorDetails,
): T {
  assert(value, message, details);

  return value;
}

export function assertSchema<T>(
  data: unknown,
  schema: z.ZodType<T, any>,
): asserts data is T {
  const res = schema.safeParse(data);

  if (!res.success) {
    throw new ValidationError(zodErrorToString(res.error));
  }
}

function zodErrorToString(error: ZodError) {
  console.log(error);
  return error.issues
    .map((issue) => `Field ${issue.path.join('.')} - ${issue.message}`)
    .join('\n');
}
