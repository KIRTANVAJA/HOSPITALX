import { describe, it, expect } from 'vitest';
import { z } from 'zod';

describe('Environment Variable Validation', () => {
  const envTestSchema = z.object({
    PORT: z
      .string()
      .transform((val) => parseInt(val, 10))
      .pipe(z.number().positive()),
    NODE_ENV: z.enum(['development', 'production', 'test']),
    JWT_SECRET: z.string().min(16),
  });

  it('validates correct environment configuration', () => {
    const valid = {
      PORT: '4000',
      NODE_ENV: 'test',
      JWT_SECRET: 'super_secret_minimum_16_chars_here',
    };
    const parsed = envTestSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.PORT).toBe(4000);
    }
  });

  it('rejects short JWT secret with validation error', () => {
    const invalid = {
      PORT: '4000',
      NODE_ENV: 'test',
      JWT_SECRET: 'short',
    };
    const parsed = envTestSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it('rejects invalid PORT numbers', () => {
    const invalid = {
      PORT: '-10',
      NODE_ENV: 'test',
      JWT_SECRET: 'super_secret_minimum_16_chars_here',
    };
    const parsed = envTestSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });
});
