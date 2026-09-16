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

    /* -- SMS ---------------------------------------------------------------- */

    /**
     * Which transport carries messages.
     *
     * `log` writes them to the server log and sends nothing. That is the right
     * default for a checkout being developed against fixtures — but it means
     * one-time codes are printed in plain text, which is why the production
     * guard below refuses to boot with it.
     */
    SMS_PROVIDER: z.enum(['log', 'sms-webservice']).default('log'),

    /**
     * The panel's V3 root, without a trailing slash.
     *
     * Configurable so an integration test can point at a local mock, not
     * because the vendor moves. The scheme is checked below: this key travels
     * in the body of every request.
     */
    SMS_BASE_URL: z.url().default('https://api.sms-webservice.com/api/V3'),

    /** The panel's ApiKey. Required once `SMS_PROVIDER` is a real provider. */
    SMS_API_KEY: z.string().default(''),

    /**
     * The line free text is sent from, as digits.
     *
     * A number rather than a name, and long: Iranian service lines run to
     * fourteen digits. `AccountInfo` reports the lines the panel actually
     * holds, which is the way to discover this value rather than guess it.
     */
    SMS_SENDER: z
      .string()
      .regex(/^\d{4,20}$/u, { message: 'SMS_SENDER must be the sending line, digits only' })
      .optional(),

    /**
     * The approved template a one-time code is sent through.
     *
     * Required in production, and the reason is not tidiness. A code sent as
     * free text goes out over the panel's ordinary line, and any recipient who
     * has ever blocked advertising from that line — or sent the stop keyword to
     * it — silently never receives it. They would be unable to sign in at all,
     * and the delivery report would say `rejected` long after they gave up.
     * Templates ride service lines, which are exempt.
     */
    SMS_OTP_TEMPLATE_KEY: z.string().min(1).optional(),

    /**
     * How long to wait for the panel before giving up on one request.
     *
     * Short on purpose. A send is never retried, so a slow panel must not hold
     * a customer's login request open until their browser times out instead.
     */
    SMS_TIMEOUT_MS: z.coerce.number().int().min(1_000).max(30_000).default(8_000),
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

    // A configured provider needs the credentials to reach it, in every
    // environment: booting without them only moves the failure to the first
    // customer who tries to sign in.
    if (env.SMS_PROVIDER !== 'log') {
      if (env.SMS_API_KEY.trim() === '') {
        ctx.addIssue({
          code: 'custom',
          path: ['SMS_API_KEY'],
          message: `SMS_API_KEY is required when SMS_PROVIDER is ${env.SMS_PROVIDER}`,
        });
      }

      if (env.SMS_SENDER === undefined) {
        ctx.addIssue({
          code: 'custom',
          path: ['SMS_SENDER'],
          message: `SMS_SENDER is required when SMS_PROVIDER is ${env.SMS_PROVIDER}`,
        });
      }
    }

    // The ApiKey is in the body of every request, so plain http would put it on
    // the wire in clear — along with the one-time code in the template
    // parameters. Allowed only against a loopback mock.
    if (env.SMS_BASE_URL.startsWith('http://')) {
      const host = URL.parse(env.SMS_BASE_URL)?.hostname ?? '';
      if (host !== 'localhost' && host !== '127.0.0.1' && host !== '[::1]') {
        ctx.addIssue({
          code: 'custom',
          path: ['SMS_BASE_URL'],
          message: 'SMS_BASE_URL must use https outside loopback; it carries the API key',
        });
      }
    }

    if (env.NODE_ENV !== 'production') return;

    // In production `log` does not mean «no SMS». It means every one-time code
    // is written to the server log and none of them is delivered.
    if (env.SMS_PROVIDER === 'log') {
      ctx.addIssue({
        code: 'custom',
        path: ['SMS_PROVIDER'],
        message: 'SMS_PROVIDER must not be "log" in production; codes would be logged, not sent',
      });
    }

    if (env.SMS_OTP_TEMPLATE_KEY === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['SMS_OTP_TEMPLATE_KEY'],
        message:
          'SMS_OTP_TEMPLATE_KEY is required in production; codes sent as free text are dropped for recipients who blocked the line',
      });
    }

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
