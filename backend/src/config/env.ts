import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env if present
dotenv.config();

const envSchema = z.object({
  PORT: z
    .string()
    .default('4000')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive()),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().default('mysql://hospitalx_user:hospitalx_password@localhost:3306/hospitalx_db'),
  JWT_SECRET: z
    .string()
    .min(16, 'JWT_SECRET must be at least 16 characters long')
    .default('hospitalx_dev_secret_key_minimum_32_characters_long_for_security'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  RATE_LIMIT_WINDOW_MS: z
    .string()
    .default('900000')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive()),
  RATE_LIMIT_MAX: z
    .string()
    .default('200')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive()),
  DEFAULT_HOSPITAL_CODE: z.string().default('HOSP-CENTRAL-01'),
  DEFAULT_HOSPITAL_NAME: z.string().default('HospitalX Central Memorial Hospital'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  // Safe formatting: do not print raw values that might contain secrets
  const errorDetails = parsedEnv.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ');
  console.error(`[HospitalX Config Error] Environment validation failed: ${errorDetails}`);
  throw new Error(`Environment validation failure: ${errorDetails}`);
}

export const env = parsedEnv.data;
export type Env = typeof env;
