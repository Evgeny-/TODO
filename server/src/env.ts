import { ensureTruthy } from './utils/asserts';

export const JWT_SECRET = getSecret('JWT_SECRET');
export const PORT = getOptionalSecret('PORT');
export const DATABASE_URL = getSecret('DATABASE_URL');

function getSecret(name: string): string {
  return ensureTruthy(
    process.env[name],
    `Missing required env variable: ${name}`,
  );
}

function getOptionalSecret(name: string): string | undefined {
  return process.env[name];
}
