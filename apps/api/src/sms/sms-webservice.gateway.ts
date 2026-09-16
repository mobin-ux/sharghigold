/**
 * The adapter for sms-webservice.com's V3 API.
 *
 * The only file in the repository that knows this vendor exists. Everything
 * above it speaks `SmsGateway` and the shared contract vocabulary, so replacing
 * the panel is this file plus one line of configuration.
 *
 * Four decisions here are deliberate and cost something, so they are written
 * down rather than left to be re-litigated by whoever reads the vendor's
 * examples and wonders why the code does not match them.
 *
 * **Every call is a POST, and the key rides in the body.** The vendor documents
 * `Send` and `SendTokenSingle` as `GET` with `?ApiKey=…&Text=…` in the query
 * string, and their own sample code uses it. A URL is the single most-copied
 * string in any infrastructure: it is in the access log of every proxy it
 * passes, in error reports, in the browser history of anyone who pastes it. For
 * a one-time code that URL also carries the code itself. Both methods have POST
 * equivalents that take the same arguments in a JSON body, so those are used
 * and the GET forms are never called.
 *
 * **Every call is https**, enforced in `config/env.ts`. The vendor's samples use
 * `http://`, which puts the key and the code on the wire in clear.
 *
 * **A send is never retried.** The acknowledgement is the only evidence a
 * message was accepted, and a request that timed out may have been accepted
 * anyway. Retrying it bills twice and delivers two different codes to someone
 * trying to log in once. Reads are retried, because asking twice costs nothing.
 *
 * **`FinalText` is dropped the moment it is parsed.** For a login code the
 * vendor returns the fully substituted message — the code in plain text — and
 * it must not reach a log, a response or a database row.
 */
import { Logger } from '@nestjs/common';
import {
  maskIranianMobile,
  smsSegments,
  type SmsAccountInfo,
  type SmsSendResult,
  type SmsStatusQuery,
  type SmsStatusReport,
} from '@sharghigold/contracts';
import type { z } from 'zod';

import { describeProviderError, describeProviderStatus } from './provider/codes.js';
import {
  accountInfoResultSchema,
  envelopeSchema,
  sendResultSchema,
  sendTokenResultSchema,
  statusResultSchema,
} from './provider/wire.js';
import { SmsProviderError, SmsTransportError } from './sms.errors.js';
import type { OutboundTemplate, OutboundText, SmsGateway } from './sms.port.js';

export interface SmsWebserviceConfig {
  /** The V3 root, without a trailing slash. */
  readonly baseUrl: string;
  readonly apiKey: string;
  /** The line free text is sent from, as digits. */
  readonly sender: string;
  readonly timeoutMs: number;
}

/**
 * The vendor caps a batch at ninety-nine recipients for sends and a hundred for
 * status lookups. Both are enforced before the request rather than discovered
 * as error 9.
 */
const STATUS_BATCH_MAX = 100;

/** Reads only. A send that failed is not sent again — see the header. */
const READ_ATTEMPTS = 3;

export class SmsWebserviceGateway implements SmsGateway {
  private readonly logger = new Logger(SmsWebserviceGateway.name);

  constructor(private readonly config: SmsWebserviceConfig) {}

  /* ------------------------------------------------------------------ */
  /* Sending                                                            */
  /* ------------------------------------------------------------------ */

  async sendText(message: OutboundText): Promise<SmsSendResult> {
    const envelope = await this.call(
      'SendBulk',
      {
        Text: message.text,
        Sender: Number(this.config.sender),
        Recipients: [
          {
            Destination: destinationOf(message.mobile),
            UserTraceId: Number(message.traceId),
          },
        ],
      },
      sendResultSchema,
      { attempts: 1 },
    );

    const refusal = this.refusalOf(envelope, message.mobile);
    if (refusal !== undefined) return refusal;

    const accepted = envelope.Result?.[0];
    if (accepted === undefined) {
      throw new SmsTransportError('provider reported success with no recipient in Result');
    }

    return {
      status: 'accepted',
      providerMessageId: accepted.Id,
      traceId: accepted.UserTraceId ?? message.traceId,
      segments: smsSegments(message.text),
    };
  }

  /**
   * Send through an approved template.
   *
   * `SendTokenMulti` rather than the single-recipient method, although there is
   * exactly one recipient: it is the only template endpoint that carries a
   * `UserTraceId`, and without one a delivery report cannot be matched to the
   * dispatch that caused it.
   */
  async sendTemplate(message: OutboundTemplate): Promise<SmsSendResult> {
    const envelope = await this.call(
      'SendTokenMulti',
      {
        TemplateKey: message.templateKey,
        Recipients: [
          {
            Destination: destinationOf(message.mobile),
            UserTraceId: Number(message.traceId),
            Parameters: [...message.parameters],
          },
        ],
      },
      sendTokenResultSchema,
      { attempts: 1 },
    );

    const refusal = this.refusalOf(envelope, message.mobile);
    if (refusal !== undefined) return refusal;

    const accepted = envelope.Result?.[0];
    if (accepted === undefined) {
      throw new SmsTransportError('provider reported success with no recipient in Result');
    }

    // `accepted.FinalText` holds the substituted template — for a login code,
    // the code itself. It is read nowhere and goes out of scope here.
    return {
      status: 'accepted',
      providerMessageId: accepted.Id,
      traceId: accepted.UserTraceId ?? message.traceId,
      // Counted from what the template produced, when the vendor tells us. A
      // template is the one message whose final length we did not choose.
      segments: smsSegments(accepted.FinalText ?? ''),
    };
  }

  /* ------------------------------------------------------------------ */
  /* Reading                                                            */
  /* ------------------------------------------------------------------ */

  async deliveryReports(query: SmsStatusQuery): Promise<readonly SmsStatusReport[]> {
    const byMessageId = query.messageIds !== undefined;
    const ids = query.messageIds ?? query.traceIds ?? [];

    if (ids.length === 0) return [];
    if (ids.length > STATUS_BATCH_MAX) {
      throw new SmsTransportError(
        `delivery reports are limited to ${String(STATUS_BATCH_MAX)} identifiers per request`,
      );
    }

    const envelope = await this.call(
      byMessageId ? 'StatusById' : 'StatusByUserTraceId',
      byMessageId ? { Ids: ids.map(Number) } : { UserTraceIds: ids.map(Number) },
      statusResultSchema,
      { attempts: READ_ATTEMPTS },
    );

    this.throwOnRefusal(envelope, 'delivery reports');

    return (envelope.Result ?? []).map((row) => ({
      providerMessageId: row.Id,
      traceId: row.UserTraceId,
      status: describeProviderStatus(row.StatusCode).status,
      providerStatusCode: row.StatusCode,
    }));
  }

  async accountInfo(): Promise<SmsAccountInfo> {
    const envelope = await this.call('AccountInfo', {}, accountInfoResultSchema, {
      attempts: READ_ATTEMPTS,
    });

    this.throwOnRefusal(envelope, 'account info');

    const result = envelope.Result;
    if (result === null) {
      throw new SmsTransportError('provider reported success with no account detail');
    }

    return { credit: result.Credit, availableSenders: result.AvailableSenders };
  }

  /* ------------------------------------------------------------------ */
  /* The one place a request is made                                    */
  /* ------------------------------------------------------------------ */

  /**
   * Post one V3 method and parse its envelope.
   *
   * `ApiKey` is added here, in one place, so that no call site can forget it
   * and none can be tempted to put it anywhere but the body.
   */
  private async call<T extends z.ZodType>(
    method: string,
    body: Readonly<Record<string, unknown>>,
    result: T,
    options: { readonly attempts: number },
  ): Promise<z.output<ReturnType<typeof envelopeSchema<T>>>> {
    const schema = envelopeSchema(result);
    let lastTransportFailure: unknown;

    for (let attempt = 1; attempt <= options.attempts; attempt += 1) {
      let response: Response;

      try {
        response = await fetch(`${this.config.baseUrl}/${method}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ ApiKey: this.config.apiKey, ...body }),
          signal: AbortSignal.timeout(this.config.timeoutMs),
          // The key is in the body, so a redirect to another host would hand it
          // to whoever controls that host.
          redirect: 'error',
        });
      } catch (cause) {
        lastTransportFailure = cause;
        // The message is ours, not the thrown error's: a fetch failure can
        // quote the request, and the request contains the key.
        this.logger.warn(
          `SMS ${method}: could not reach the provider (attempt ${String(attempt)}/${String(options.attempts)})`,
        );
        continue;
      }

      if (!response.ok) {
        lastTransportFailure = new SmsTransportError(
          `SMS ${method}: provider answered HTTP ${String(response.status)}`,
        );
        this.logger.warn(`SMS ${method}: provider answered HTTP ${String(response.status)}`);
        continue;
      }

      const payload: unknown = await response.json().catch(() => undefined);
      const parsed = schema.safeParse(payload);

      if (!parsed.success) {
        // The body is not echoed: it can contain `FinalText`, and `FinalText`
        // contains the one-time code.
        throw new SmsTransportError(
          `SMS ${method}: provider response did not match the expected shape`,
          { cause: parsed.error },
        );
      }

      return parsed.data;
    }

    throw new SmsTransportError(
      `SMS ${method}: provider unreachable after ${String(options.attempts)} attempt(s)`,
      { cause: lastTransportFailure },
    );
  }

  /* ------------------------------------------------------------------ */
  /* Turning a refusal into something safe to act on                    */
  /* ------------------------------------------------------------------ */

  /** A refusal a send reports as a value, or undefined when it succeeded. */
  private refusalOf(
    envelope: { readonly Success: boolean; readonly ErrorCode: number | null },
    mobile: string,
  ): SmsSendResult | undefined {
    if (envelope.Success) return undefined;

    const described = describeProviderError(envelope.ErrorCode);

    // The vendor's own `Error` sentence is never logged: it is written for the
    // account holder and has been seen to quote panel details. The code and our
    // description of it say everything an operator needs.
    this.logger.warn(
      `SMS send refused for ${maskIranianMobile(mobile)}: ${described.note} (provider code ${String(envelope.ErrorCode)})`,
    );

    return { status: 'refused', reason: described.reason, retryable: described.retryable };
  }

  /** The same refusal, where the caller asked a question rather than sent. */
  private throwOnRefusal(
    envelope: { readonly Success: boolean; readonly ErrorCode: number | null },
    what: string,
  ): void {
    if (envelope.Success) return;

    const described = describeProviderError(envelope.ErrorCode);
    throw new SmsProviderError(`SMS ${what} refused: ${described.note}`, {
      providerCode: envelope.ErrorCode,
      retryable: described.retryable,
    });
  }
}

/**
 * The recipient, in the shape the vendor insists on.
 *
 * Our canonical form is `09XXXXXXXXX`; the panel answers error 13 to anything
 * that does not start with `9` or `989`, so the leading zero comes off. Ten
 * digits, comfortably inside what a double holds exactly.
 */
function destinationOf(mobile: string): number {
  return Number(mobile.slice(1));
}
