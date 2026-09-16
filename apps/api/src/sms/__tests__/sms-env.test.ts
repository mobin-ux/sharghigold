/**
 * The configuration guards around SMS.
 *
 * Each of these is a failure that would otherwise be discovered by a customer
 * who cannot log in, which is the most expensive place to discover it.
 */
import { describe, expect, it } from 'vitest';

import { EnvironmentError, loadEnv } from '../../config/env.js';

const DEV = {
  NODE_ENV: 'development',
  DATABASE_URL: 'postgresql://postgres:secret@127.0.0.1:5432/sharghigold_dev',
  REDIS_URL: 'redis://127.0.0.1:6379',
  CORS_ALLOWED_ORIGINS: 'http://localhost:3000',
  SESSION_SECRET: 'a'.repeat(32),
} satisfies NodeJS.ProcessEnv;

const PRODUCTION = {
  ...DEV,
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://postgres:secret@db.internal:5432/sharghigold',
  CORS_ALLOWED_ORIGINS: 'https://sharghigold.ir',
  SMS_PROVIDER: 'sms-webservice',
  SMS_API_KEY: 'a-real-key',
  SMS_SENDER: '50004075005185',
  SMS_OTP_TEMPLATE_KEY: 'otp-v1',
} satisfies NodeJS.ProcessEnv;

describe('defaults', () => {
  it('sends nothing until a provider is named', () => {
    const env = loadEnv(DEV);
    expect(env.SMS_PROVIDER).toBe('log');
    expect(env.SMS_BASE_URL).toBe('https://api.sms-webservice.com/api/V3');
    expect(env.SMS_TIMEOUT_MS).toBe(8_000);
  });
});

describe('a named provider needs what it takes to reach it', () => {
  it('refuses a provider with no key', () => {
    expect(() => loadEnv({ ...DEV, SMS_PROVIDER: 'sms-webservice', SMS_SENDER: '3000' })).toThrow(
      EnvironmentError,
    );
  });

  it('refuses a provider with no sending line', () => {
    expect(() => loadEnv({ ...DEV, SMS_PROVIDER: 'sms-webservice', SMS_API_KEY: 'key' })).toThrow(
      EnvironmentError,
    );
  });

  it('refuses a sending line that is not digits', () => {
    expect(() =>
      loadEnv({
        ...DEV,
        SMS_PROVIDER: 'sms-webservice',
        SMS_API_KEY: 'key',
        SMS_SENDER: '+98-3000',
      }),
    ).toThrow(EnvironmentError);
  });

  it('never names the key in the failure it reports', () => {
    // A boot failure is shipped to a log aggregator like any other line.
    try {
      loadEnv({ ...DEV, SMS_PROVIDER: 'sms-webservice', SMS_API_KEY: 'super-secret-key' });
      expect.unreachable('expected loadEnv to refuse');
    } catch (error) {
      expect(String(error)).toContain('SMS_SENDER');
      expect(String(error)).not.toContain('super-secret-key');
    }
  });
});

describe('the key never travels in clear', () => {
  it('refuses a plain-http provider address', () => {
    // The ApiKey is in the body of every request, and for a template so is the
    // one-time code.
    expect(() =>
      loadEnv({
        ...DEV,
        SMS_PROVIDER: 'sms-webservice',
        SMS_API_KEY: 'key',
        SMS_SENDER: '3000',
        SMS_BASE_URL: 'http://api.sms-webservice.com/api/V3',
      }),
    ).toThrow(EnvironmentError);
  });

  it('allows plain http against a loopback mock', () => {
    const env = loadEnv({
      ...DEV,
      SMS_PROVIDER: 'sms-webservice',
      SMS_API_KEY: 'key',
      SMS_SENDER: '3000',
      SMS_BASE_URL: 'http://127.0.0.1:4010/api/V3',
    });

    expect(env.SMS_BASE_URL).toBe('http://127.0.0.1:4010/api/V3');
  });
});

describe('production', () => {
  it('accepts a fully configured panel', () => {
    expect(loadEnv(PRODUCTION).SMS_OTP_TEMPLATE_KEY).toBe('otp-v1');
  });

  it('refuses to boot with the log transport', () => {
    // In production this does not mean «SMS off». It means every login code is
    // written to a file and nobody can sign in.
    expect(() => loadEnv({ ...PRODUCTION, SMS_PROVIDER: 'log' })).toThrow(EnvironmentError);
  });

  it('refuses to boot without an approved OTP template', () => {
    // Free text goes out over the ordinary line, where it is silently dropped
    // for every recipient who has blocked advertising from it.
    const { SMS_OTP_TEMPLATE_KEY: _omitted, ...withoutTemplate } = PRODUCTION;

    expect(() => loadEnv(withoutTemplate)).toThrow(EnvironmentError);
  });
});
