import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  HOST: z.string().default('0.0.0.0'),
  API_BASE_URL: z.string().default('http://localhost:3001'),

  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().default('redis://localhost:6379'),

  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),

  ANTHROPIC_API_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().default('noreply@finera.pl'),

  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),

  KSEF_DEMO_URL: z.string().default('https://ksef-demo.mf.gov.pl/api'),
  KSEF_PROD_URL: z.string().default('https://ksef.mf.gov.pl/api'),

  TINK_CLIENT_ID: z.string().optional(),
  TINK_CLIENT_SECRET: z.string().optional(),
  TINK_REDIRECT_URI: z.string().default('finera://tink-callback'),

  REVENUECAT_WEBHOOK_SECRET: z.string().optional(),

  AWS_REGION: z.string().default('eu-central-1'),
  S3_BUCKET_NAME: z.string().default('finera-receipts'),

  CORS_ORIGINS: z.string().default('http://localhost:8081'),
  MOBILE_DEEP_LINK: z.string().default('finera://'),
  WEB_URL: z.string().default('https://app.finera.pl'),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export const config = {
  isDev: env.NODE_ENV === 'development',
  isTest: env.NODE_ENV === 'test',
  isProd: env.NODE_ENV === 'production',
  cors: {
    origins: env.CORS_ORIGINS.split(',').map((o) => o.trim()),
  },
  jwt: {
    secret: env.JWT_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    accessTokenExpiry: '15m',
    refreshTokenExpiry: '30d',
  },
} as const;
