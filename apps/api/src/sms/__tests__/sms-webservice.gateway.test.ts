/**
 * The adapter, against a stubbed `fetch`.
 *
 * Most of what is asserted here is not «does it work» but «does it refuse to do
 * the dangerous thing»: no key in a URL, no retry on a send, no silent rounding
 * of an identifier, no code in a log. Those are the properties that are easy to
 * lose in a later edit and impossible to notice in production.
 */
import { Logger } from '@nestjs/common';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { SmsWebserviceGateway } from '../sms-webservice.gateway.js';
import { SmsProviderError, SmsTransportError } from '../sms.errors.js';

const CONFIG = {
  baseUrl: 'https://api.example.test/api/V3',
  apiKey: 'test-key-not-a-real-one',
  sender: '50004075005185',
  timeoutMs: 1_000,
} as const;

const MOBILE = '09120001234';
const TRACE = '1900000000000001';

function gateway(): SmsWebserviceGateway {
  return new SmsWebserviceGateway(CONFIG);
}

/** A successful V3 envelope: note `ErrorCode: null`, as the live panel sends. */
function ok(result: unknown): Response {
  return new Response(
    JSON.stringify({ Success: true, ErrorCode: null, Error: null, Result: result }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  );
}

function refused(errorCode: number): Response {
  return new Response(
    JSON.stringify({
      Success: false,
      ErrorCode: errorCode,
      // Vendor copy, written for the account holder. Never propagated.
      Error: 'خطای سامانه برای اکانت ۲۸۰۵۴۵',
      Result: null,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeAll(() => {
  // Nest's logger writes to stdout; the suite does not need the noise.
  Logger.overrideLogger(false);
});

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/** The arguments of the nth `fetch` call, as url plus parsed JSON body. */
function callAt(index: number): { url: string; init: RequestInit; body: Record<string, unknown> } {
  const call = fetchMock.mock.calls[index];
  if (call === undefined) throw new Error(`no fetch call at index ${String(index)}`);

  const [url, init] = call as [string, RequestInit];
  return { url, init, body: JSON.parse(String(init.body)) as Record<string, unknown> };
}

describe('how the request is made', () => {
  it('never puts the API key in the URL', async () => {
    fetchMock.mockResolvedValue(ok([{ Id: 1234, UserTraceId: Number(TRACE) }]));

    await gateway().sendText({ mobile: MOBILE, text: 'سلام', traceId: TRACE });

    const { url, init, body } = callAt(0);
    // The vendor documents a GET form with `?ApiKey=…&Text=…`. A URL ends up in
    // every proxy access log it passes; for a login code it would carry the
    // code too.
    expect(url).toBe('https://api.example.test/api/V3/SendBulk');
    expect(url).not.toContain('?');
    expect(url).not.toContain(CONFIG.apiKey);
    expect(init.method).toBe('POST');
    expect(body['ApiKey']).toBe(CONFIG.apiKey);
  });

  it('refuses to follow a redirect, which would hand the key to another host', async () => {
    fetchMock.mockResolvedValue(ok([{ Id: 1, UserTraceId: 2 }]));
    await gateway().sendText({ mobile: MOBILE, text: 'x', traceId: TRACE });

    expect(callAt(0).init.redirect).toBe('error');
  });

  it('sends the recipient in the shape the vendor insists on', async () => {
    fetchMock.mockResolvedValue(ok([{ Id: 1, UserTraceId: 2 }]));
    await gateway().sendText({ mobile: MOBILE, text: 'x', traceId: TRACE });

    // Error 13 is «must start with 9 or 989», so the leading zero comes off.
    const recipients = callAt(0).body['Recipients'] as { Destination: number }[];
    expect(recipients[0]?.Destination).toBe(9_120_001_234);
    expect(callAt(0).body['Sender']).toBe(50_004_075_005_185);
  });
});

describe('sending text', () => {
  it('reports the provider’s identifiers and the billed segment count', async () => {
    fetchMock.mockResolvedValue(ok([{ Id: 987_654, UserTraceId: Number(TRACE) }]));

    const result = await gateway().sendText({
      // Persian is UCS-2, so this is two segments rather than one.
      mobile: MOBILE,
      text: 'ا'.repeat(80),
      traceId: TRACE,
    });

    expect(result).toEqual({
      status: 'accepted',
      providerMessageId: '987654',
      traceId: TRACE,
      segments: 2,
    });
  });

  it('turns a refusal into a value, not an exception', async () => {
    fetchMock.mockResolvedValue(refused(13));

    const result = await gateway().sendText({ mobile: MOBILE, text: 'x', traceId: TRACE });

    expect(result).toEqual({ status: 'refused', reason: 'invalid-recipient', retryable: false });
  });

  it('never repeats a send, however it failed', async () => {
    // The acknowledgement is the only evidence a message was accepted, and a
    // timed-out request may have been accepted anyway. A retry bills twice and
    // delivers two different codes to somebody signing in once.
    fetchMock.mockRejectedValue(new Error('socket hang up'));

    await expect(
      gateway().sendText({ mobile: MOBILE, text: 'x', traceId: TRACE }),
    ).rejects.toBeInstanceOf(SmsTransportError);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not repeat a send after an HTTP error either', async () => {
    fetchMock.mockResolvedValue(new Response('gateway timeout', { status: 504 }));

    await expect(
      gateway().sendText({ mobile: MOBILE, text: 'x', traceId: TRACE }),
    ).rejects.toBeInstanceOf(SmsTransportError);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('rejects an identifier too large to survive JSON.parse', async () => {
    // Above 2^53 a `long` is silently rounded to the nearest double. The id
    // still looks like an id; the only symptom is that every later delivery
    // report fails to match. Failing loudly is the lesser evil.
    fetchMock.mockResolvedValue(ok([{ Id: 1e17, UserTraceId: 1 }]));

    await expect(
      gateway().sendText({ mobile: MOBILE, text: 'x', traceId: TRACE }),
    ).rejects.toBeInstanceOf(SmsTransportError);
  });
});

describe('sending a template', () => {
  it('uses the only template method that carries our trace id', async () => {
    fetchMock.mockResolvedValue(
      ok([{ Id: 5, UserTraceId: Number(TRACE), Sender: 3000, FinalText: 'کد ورود: 12345' }]),
    );

    await gateway().sendTemplate({
      mobile: MOBILE,
      templateKey: 'otp-template',
      parameters: ['12345', '2'],
      traceId: TRACE,
    });

    const { url, body } = callAt(0);
    // `SendTokenSingle` has no UserTraceId, so a delivery report could not be
    // matched back to the dispatch that caused it.
    expect(url).toContain('SendTokenMulti');
    expect(body['TemplateKey']).toBe('otp-template');
  });

  it('does not return the substituted text, which contains the code', async () => {
    fetchMock.mockResolvedValue(
      ok([{ Id: 5, UserTraceId: Number(TRACE), Sender: 3000, FinalText: 'کد ورود: 12345' }]),
    );

    const result = await gateway().sendTemplate({
      mobile: MOBILE,
      templateKey: 'otp-template',
      parameters: ['12345', '2'],
      traceId: TRACE,
    });

    expect(JSON.stringify(result)).not.toContain('12345');
    expect(result).toEqual({
      status: 'accepted',
      providerMessageId: '5',
      traceId: TRACE,
      segments: 1,
    });
  });
});

describe('reading', () => {
  it('retries a read, because asking twice costs nothing', async () => {
    fetchMock
      .mockRejectedValueOnce(new Error('socket hang up'))
      .mockRejectedValueOnce(new Error('socket hang up'))
      .mockResolvedValueOnce(ok({ Credit: 1000, AvailableSenders: [50_004_075_005_185] }));

    const info = await gateway().accountInfo();

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(info).toEqual({ credit: '1000', availableSenders: ['50004075005185'] });
  });

  it('gives up after its last attempt rather than looping', async () => {
    fetchMock.mockRejectedValue(new Error('socket hang up'));

    await expect(gateway().accountInfo()).rejects.toBeInstanceOf(SmsTransportError);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('throws when the panel refuses a question, rather than returning nothing', async () => {
    // A refused read is a misconfigured account, not «no messages». Returning
    // an empty list would look like a clean bill of health.
    fetchMock.mockResolvedValue(refused(1));

    await expect(gateway().accountInfo()).rejects.toBeInstanceOf(SmsProviderError);
  });

  it('maps delivery reports into our own vocabulary', async () => {
    fetchMock.mockResolvedValue(
      ok([
        { Id: 11, UserTraceId: 21, StatusCode: 4, Status: 'تحویل به گوشی' },
        { Id: 12, UserTraceId: 22, StatusCode: 7, Status: 'گیرنده مسدود' },
      ]),
    );

    const reports = await gateway().deliveryReports({ messageIds: ['11', '12'] });

    expect(callAt(0).url).toContain('StatusById');
    expect(reports).toEqual([
      { providerMessageId: '11', traceId: '21', status: 'delivered', providerStatusCode: 4 },
      { providerMessageId: '12', traceId: '22', status: 'rejected', providerStatusCode: 7 },
    ]);
  });

  it('asks by our reference when that is what it was given', async () => {
    fetchMock.mockResolvedValue(ok([]));
    await gateway().deliveryReports({ traceIds: [TRACE] });

    const { url, body } = callAt(0);
    expect(url).toContain('StatusByUserTraceId');
    expect(body['UserTraceIds']).toEqual([Number(TRACE)]);
  });

  it('asks nothing at all for an empty list', async () => {
    await expect(gateway().deliveryReports({ messageIds: [] })).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('a response that is not what the vendor documented', () => {
  it('fails rather than guessing', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ unexpected: true }), { status: 200 }),
    );

    await expect(gateway().accountInfo()).rejects.toBeInstanceOf(SmsTransportError);
  });

  it('does not echo the body it could not parse', async () => {
    // The body can contain `FinalText`, and `FinalText` contains the code.
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ Success: true, Result: [{ FinalText: 'کد ورود: 98765' }] }), {
        status: 200,
      }),
    );

    await expect(
      gateway().sendTemplate({
        mobile: MOBILE,
        templateKey: 'k',
        parameters: ['98765'],
        traceId: TRACE,
      }),
    ).rejects.toSatisfy((error: unknown) => !String(error).includes('98765'));
  });
});
