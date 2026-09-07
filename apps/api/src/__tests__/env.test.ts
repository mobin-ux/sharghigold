import { describe, expect, it } from 'vitest';

import { EnvironmentError, loadEnv } from '../config/env.js';

const VALID = {
  NODE_ENV: 'development',
  DATABASE_URL: 'postgresql://postgres:secret@127.0.0.1:5432/sharghigold_dev',
  REDIS_URL: 'redis://127.0.0.1:6379',
  CORS_ALLOWED_ORIGINS: 'http://localhost:3000',
  SESSION_SECRET: 'a'.repeat(32),
} satisfies NodeJS.ProcessEnv;

describe('loadEnv', () => {
  it('accepts a valid development environment and applies defaults', () => {
    const env = loadEnv(VALID);
    expect(env.API_PORT).toBe(3001);
    expect(env.SESSION_TTL_SECONDS).toBe(2_592_000);
    expect(env.OTP_TTL_SECONDS).toBe(120);
    expect(env.CORS_ALLOWED_ORIGINS).toEqual(['http://localhost:3000']);
  });

  it('parses a comma-separated origin allowlist', () => {
    const env = loadEnv({
      ...VALID,
      CORS_ALLOWED_ORIGINS: 'http://localhost:3000, http://localhost:3002',
    });
    expect(env.CORS_ALLOWED_ORIGINS).toEqual(['http://localhost:3000', 'http://localhost:3002']);
  });

  it('has no wildcard CORS option at all', () => {
    // '*' is not a URL, so it cannot be configured even by mistake.
    expect(() => loadEnv({ ...VALID, CORS_ALLOWED_ORIGINS: '*' })).toThrow(EnvironmentError);
  });

  it('refuses a short session secret', () => {
    expect(() => loadEnv({ ...VALID, SESSION_SECRET: 'too-short' })).toThrow(EnvironmentError);
  });

  it('refuses missing required variables', () => {
    const { DATABASE_URL: _omitted, ...withoutDatabase } = VALID;
    expect(() => loadEnv(withoutDatabase)).toThrow(EnvironmentError);
  });

  it('names the offending variable but never echoes its value', () => {
    try {
      loadEnv({ ...VALID, SESSION_SECRET: 'short-secret-value' });
      expect.unreachable('should have thrown');
    } catch (error) {
      const message = (error as Error).message;
      expect(message).toContain('SESSION_SECRET');
      expect(message).not.toContain('short-secret-value');
    }
  });

  describe('production guards', () => {
    const production = { ...VALID, NODE_ENV: 'production' };

    it('rejects plaintext http origins', () => {
      expect(() =>
        loadEnv({
          ...production,
          CORS_ALLOWED_ORIGINS: 'http://sharghigold.ir',
          DATABASE_URL: 'postgresql://user:pass@db.internal:5432/app',
        }),
      ).toThrow(EnvironmentError);
    });

    it('rejects a localhost database', () => {
      expect(() =>
        loadEnv({ ...production, CORS_ALLOWED_ORIGINS: 'https://sharghigold.ir' }),
      ).toThrow(EnvironmentError);
    });

    it('accepts a correctly configured production environment', () => {
      const env = loadEnv({
        ...production,
        CORS_ALLOWED_ORIGINS: 'https://sharghigold.ir',
        DATABASE_URL: 'postgresql://user:pass@db.internal:5432/app',
      });
      expect(env.NODE_ENV).toBe('production');
    });
  });
});
