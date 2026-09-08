/**
 * Environment configuration, validated once at startup.
 *
 * The process refuses to boot on invalid configuration rather than discovering
 * it on the first request. A missing session secret or a wildcard CORS origin
 * is a security failure, and failing loudly at deploy time is far cheaper than
 * failing quietly in production (rules 41 and 6).
 *
 * Nothing here has a production-safe default. Defaults exist only for local
 * development ergonomics, and the production guards below reject them.
 */
import { z } from 'zod';

const MIN_SESSION_SECRET_BYTES = 32;

const commaSeparatedOrigins = z
  .string()
  .transform((value) =>
    value
      .split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0),
  )
  .pipe(z.array(z.url()).min(1));

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

    DATABASE_URL: z.string().startsWith('postgresql://'),
    REDIS_URL: z.string().startsWith('redis://'),

    API_PORT: z.coerce.number().int().min(1).max(65_535).default(3001),

    /**
     * Interface to bind. Loopback by default, because the API is expected to
     * sit behind a reverse proxy on the same host and defaulting to 0.0.0.0
     * would publish it. It is configurable because a container's loopback is
     * not reachable from outside the container, so the compose topology has to
     * be able to set 0.0.0.0 deliberately.
     */
    API_BIND_HOST: z.string().min(1).default('127.0.0.1'),

    /**
     * Explicit origin allowlist. There is no wildcard option, by construction:
     * credentialed requests with `Access-Control-Allow-Origin: *` are exactly
     * the misconfiguration rule 11 warns about.
     */
    CORS_ALLOWED_ORIGINS: commaSeparatedOrigins,

    SESSION_SECRET: z.string().min(1),
    SESSION_TTL_SECONDS: z.coerce.number().int().min(60).default(2_592_000),

    /** How long a checkout price quote is honoured before re-confirmation. */
    PRICE_QUOTE_TTL_SECONDS: z.coerce.number().int().min(30).default(900),
    /** Refuse to transact on a spot price older than this. */
    GOLD_PRICE_MAX_STALENESS_SECONDS: z.coerce.number().int().min(30).default(600),

    OTP_TTL_SECONDS: z.coerce.number().int().min(30).max(600).default(120),
  })
  .superRefine((env, ctx) => {
    // A short secret is a weak secret regardless of environment.
    const secretBytes = Buffer.from(env.SESSION_SECRET, 'utf8').byteLength;
    if (secretBytes < MIN_SESSION_SECRET_BYTES) {
      ctx.addIssue({
        code: 'custom',
        path: ['SESSION_SECRET'],
        message: `SESSION_SECRET must be at least ${MIN_SESSION_SECRET_BYTES} bytes`,
      });
    }

    if (env.NODE_ENV !== 'production') return;

    // Guards that only make sense once real customers are involved.
    for (const origin of env.CORS_ALLOWED_ORIGINS) {
      if (origin.startsWith('http://')) {
        ctx.addIssue({
          code: 'custom',
          path: ['CORS_ALLOWED_ORIGINS'],
          message: `Production origins must use https, received ${origin}`,
        });
      }
    }

    if (env.DATABASE_URL.includes('@127.0.0.1') || env.DATABASE_URL.includes('@localhost')) {
      ctx.addIssue({
        code: 'custom',
        path: ['DATABASE_URL'],
        message: 'Production DATABASE_URL must not point at localhost',
      });
    }
  });

export type Env = z.output<typeof envSchema>;

export class EnvironmentError extends Error {
  override readonly name = 'EnvironmentError';
}

/**
 * Parse and validate the environment.
 *
 * The error message names the offending variables but never echoes their
 * values, so a boot failure cannot leak a secret into a log aggregator.
 */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(source);

  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    throw new EnvironmentError(`Invalid environment configuration:\n${problems}`);
  }

  return result.data;
}
