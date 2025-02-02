import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { assert, assertFound, ensureTruthy, assertSchema } from './asserts';
import { ValidationError } from './errors';

describe('assert', () => {
  it('should throw ValidationError if the value is falsy', () => {
    expect(() => assert(false)).toThrow(ValidationError);
  });

  it('should not throw an error if the value is truthy', () => {
    expect(() => assert(true)).not.toThrow();
  });
});

describe('assertFound', () => {
  it('should throw ValidationError with status code 404 if the value is falsy', () => {
    expect(() => assertFound(undefined)).toThrow(ValidationError);
    expect(() => assertFound(null)).toThrow(ValidationError);
  });

  it('should not throw an error if the value is truthy', () => {
    expect(() => assertFound(42)).not.toThrow();
  });
});

describe('ensureTruthy', () => {
  it('should throw ValidationError if the value is falsy', () => {
    expect(() => ensureTruthy(false)).toThrow(ValidationError);
  });

  it('should not throw an error if the value is truthy', () => {
    expect(() => ensureTruthy(true)).not.toThrow();
  });

  it('should return the value if truthy', () => {
    expect(ensureTruthy(42)).toBe(42);
  });
});

describe('assertSchema', () => {
  const schema = z.object({
    name: z.string(),
    age: z.number().positive(),
  });

  it('should not throw an error if the value matches the schema', () => {
    const validValue = { name: 'John Doe', age: 25 };
    expect(() => assertSchema(validValue, schema)).not.toThrow();
  });

  it('should throw a ValidationError if the value does not match the schema', () => {
    const invalidValue = { name: 'John Doe', age: -25 };
    expect(() => assertSchema(invalidValue, schema)).toThrow(ValidationError);
  });
});
