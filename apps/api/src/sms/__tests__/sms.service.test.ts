import { Logger } from '@nestjs/common';
import type { SmsSendResult } from '@sharghigold/contracts';
import { beforeAll, describe, expect, it } from 'vitest';

import { LogGateway } from '../log.gateway.js';
import { gatewayFor } from '../sms.module.js';
import type { OutboundTemplate, OutboundText, SmsGateway } from '../sms.port.js';
import { SmsService } from '../sms.service.js';
import { SmsWebserviceGateway } from '../sms-webservice.gateway.js';

import { loadEnv } from '../../config/env.js';

const MOBILE = '09120001234';

/** Records what it was asked to send and accepts everything. */
class RecordingGateway implements SmsGateway {
  readonly texts: OutboundText[] = [];
  readonly templates: OutboundTemplate[] = [];

  sendText(message: OutboundText): Promise<SmsSendResult> {
    this.texts.push(message);
    return Promise.resolve({
      status: 'accepted',
      providerMessageId: '1',
      traceId: message.traceId,
      segments: 1,
    });
  }

  sendTemplate: (message: OutboundTemplate) => Promise<SmsSendResult> = (message) => {
    this.templates.push(message);
    return Promise.resolve({
      status: 'accepted',
      providerMessageId: '2',
      traceId: message.traceId,
      segments: 1,
    });
  };

  deliveryReports(): Promise<readonly []> {
    return Promise.resolve([]);
  }

  accountInfo(): Promise<{ credit: string; availableSenders: string[] }> {
    return Promise.resolve({ credit: '0', availableSenders: [] });
  }
}

function service(gateway: SmsGateway, otpTemplateKey?: string): SmsService {
  return new SmsService(gateway, { otpTemplateKey });
}

beforeAll(() => {
  Logger.overrideLogger(false);
});

describe('sending a login code', () => {
  it('goes through the approved template when one is configured', async () => {
    const gateway = new RecordingGateway();

    await service(gateway, 'otp-v1').sendOtp({
      mobile: MOBILE,
      code: '12345',
      expiresInMinutes: 2,
    });

    expect(gateway.texts).toHaveLength(0);
    expect(gateway.templates).toHaveLength(1);
    expect(gateway.templates[0]?.templateKey).toBe('otp-v1');
    // The panel substitutes these in order: the code first, then its life.
    expect(gateway.templates[0]?.parameters).toEqual(['12345', '2']);
  });

  it('falls back to free text only when no template is configured', async () => {
    const gateway = new RecordingGateway();

    await service(gateway).sendOtp({ mobile: MOBILE, code: '12345', expiresInMinutes: 2 });

    expect(gateway.templates).toHaveLength(0);
    expect(gateway.texts).toHaveLength(1);
    expect(gateway.texts[0]?.text).toContain('12345');
  });

  it('does not return the code to its caller', async () => {
    // Callers log their results. Keeping the code out of the return value is
    // what makes that safe to do without thinking about it.
    const result = await service(new RecordingGateway(), 'otp-v1').sendOtp({
      mobile: MOBILE,
      code: '98765',
      expiresInMinutes: 2,
    });

    expect(JSON.stringify(result)).not.toContain('98765');
  });

  it('gives every message its own trace id', async () => {
    const gateway = new RecordingGateway();
    const sms = service(gateway, 'otp-v1');

    await sms.sendOtp({ mobile: MOBILE, code: '11111', expiresInMinutes: 2 });
    await sms.sendOtp({ mobile: MOBILE, code: '22222', expiresInMinutes: 2 });

    const [first, second] = gateway.templates;
    expect(first?.traceId).not.toBe(second?.traceId);
  });

  it('passes a refusal back rather than pretending it sent', async () => {
    const refusing = new RecordingGateway();
    refusing.sendTemplate = () =>
      Promise.resolve({ status: 'refused', reason: 'quota-exhausted', retryable: true });

    const result = await service(refusing, 'otp-v1').sendOtp({
      mobile: MOBILE,
      code: '12345',
      expiresInMinutes: 2,
    });

    expect(result).toEqual({ status: 'refused', reason: 'quota-exhausted', retryable: true });
  });
});

describe('sending everything else', () => {
  it('trims and forwards an ordinary message', async () => {
    const gateway = new RecordingGateway();

    const result = await service(gateway).send({
      mobile: MOBILE,
      purpose: 'transactional',
      text: '  سفارش شما ارسال شد.  ',
    });

    expect(result.status).toBe('accepted');
    expect(gateway.texts[0]?.text).toBe('سفارش شما ارسال شد.');
  });

  it('refuses an empty or over-long body before it is billed', async () => {
    const gateway = new RecordingGateway();
    const sms = service(gateway);

    const empty = await sms.send({ mobile: MOBILE, purpose: 'marketing', text: '   ' });
    const huge = await sms.send({
      mobile: MOBILE,
      purpose: 'marketing',
      text: 'ا'.repeat(1_001),
    });

    expect(empty.status).toBe('refused');
    expect(huge.status).toBe('refused');
    expect(gateway.texts).toHaveLength(0);
  });

  it('counts Persian text as UCS-2 segments', () => {
    const sms = service(new RecordingGateway());
    // Seventy characters is one segment; seventy-one spills into two parts of
    // sixty-seven. Not the hundred and sixty people expect.
    expect(sms.segmentsFor('ا'.repeat(70))).toBe(1);
    expect(sms.segmentsFor('ا'.repeat(71))).toBe(2);
    expect(sms.segmentsFor('a'.repeat(160))).toBe(1);
  });
});

describe('the log gateway', () => {
  it('records what it would have sent and never masks the code from a developer', async () => {
    const gateway = new LogGateway();

    await service(gateway, 'otp-v1').sendOtp({
      mobile: MOBILE,
      code: '12345',
      expiresInMinutes: 2,
    });

    // This is the transport a developer reads to sign in. It is also why
    // `loadEnv` refuses to boot production with it selected.
    expect(gateway.outbox()[0]?.body).toContain('12345');
  });
});

describe('which gateway the configuration selects', () => {
  const BASE = {
    NODE_ENV: 'development',
    DATABASE_URL: 'postgresql://postgres:secret@127.0.0.1:5432/sharghigold_dev',
    REDIS_URL: 'redis://127.0.0.1:6379',
    CORS_ALLOWED_ORIGINS: 'http://localhost:3000',
    SESSION_SECRET: 'a'.repeat(32),
  } satisfies NodeJS.ProcessEnv;

  it('defaults to the log transport', () => {
    expect(gatewayFor(loadEnv(BASE))).toBeInstanceOf(LogGateway);
  });

  it('builds the vendor adapter once a provider is named', () => {
    const env = loadEnv({
      ...BASE,
      SMS_PROVIDER: 'sms-webservice',
      SMS_API_KEY: 'key',
      SMS_SENDER: '50004075005185',
    });

    expect(gatewayFor(env)).toBeInstanceOf(SmsWebserviceGateway);
  });
});
