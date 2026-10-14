import { beforeAll, afterAll } from 'vitest';

beforeAll(() => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test_secret_key_minimum_32_characters_long_for_security';
  process.env.DATABASE_URL = 'mysql://test:test@localhost:3306/test';
});

afterAll(() => {
  // Global cleanup if needed
});
