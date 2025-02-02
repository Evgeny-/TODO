// tokenUtils.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { setJwtAuthToken, getJwtAuthToken } from './user-storage';

describe('tokenUtils', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('sets a non-null token', () => {
    setJwtAuthToken('my-token');
    const stored = sessionStorage.getItem('token');
    expect(stored).toBe('my-token');
  });

  it('gets the token from sessionStorage', () => {
    sessionStorage.setItem('token', 'another-token');
    const token = getJwtAuthToken();
    expect(token).toBe('another-token');
  });
});
