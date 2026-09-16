/**
 * The transport for a machine with no panel behind it.
 *
 * Writes what would have been sent to the server log and sends nothing. This is
 * how the shop is developed against fixtures, and it is the only place in the
 * system where a one-time code appears in plain text — deliberately on the
 * server, never in a response.
 *
 * `config/env.ts` refuses to boot in production with this selected, which is the
 * guard that matters: production with a log transport is not «SMS disabled», it
 * is every customer's login code written to a file nobody expected to be
 * sensitive, and nobody able to sign in.
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

import type { OutboundTemplate, OutboundText, SmsGateway } from './sms.port.js';

export class LogGateway implements SmsGateway {
  private readonly logger = new Logger('SmsLogGateway');

  /** Every message it has "sent", newest last. Read by tests, never by callers. */
  private readonly sent: { mobile: string; body: string; traceId: string }[] = [];

  sendText(message: OutboundText): Promise<SmsSendResult> {
    return Promise.resolve(this.record(message.mobile, message.text, message.traceId));
  }

  /**
   * There is no panel to substitute the template, so the parameters are logged
   * beside its key. For a login code the parameter *is* the code, which is the
   * point: this is what a developer reads to sign in.
   */
  sendTemplate(message: OutboundTemplate): Promise<SmsSendResult> {
    const body = `[${message.templateKey}] ${message.parameters.join(' | ')}`;
    return Promise.resolve(this.record(message.mobile, body, message.traceId));
  }

  /** Nothing was ever handed to an operator, so nothing can have been delivered. */
  deliveryReports(query: SmsStatusQuery): Promise<readonly SmsStatusReport[]> {
    const messageIds = query.messageIds ?? [];
    const traceIds = query.traceIds ?? [];

    return Promise.resolve([
      ...messageIds.map((id) => ({
        providerMessageId: id,
        traceId: null,
        status: 'delivered' as const,
        providerStatusCode: null,
      })),
      ...traceIds.map((id) => ({
        providerMessageId: null,
        traceId: id,
        status: 'delivered' as const,
        providerStatusCode: null,
      })),
    ]);
  }

  accountInfo(): Promise<SmsAccountInfo> {
    return Promise.resolve({ credit: '0', availableSenders: [] });
  }

  /** What this gateway has been asked to send, for assertions in tests. */
  outbox(): readonly { mobile: string; body: string; traceId: string }[] {
    return this.sent;
  }

  private record(mobile: string, body: string, traceId: string): SmsSendResult {
    this.sent.push({ mobile, body, traceId });

    // The number is masked even here. A development log is still a log, and it
    // is the one most likely to be pasted into an issue.
    this.logger.log(`[dev sms] to ${maskIranianMobile(mobile)}: ${body}`);

    return {
      status: 'accepted',
      // Distinct per message so that a caller storing it does not collapse two
      // dispatches into one row.
      providerMessageId: traceId,
      traceId,
      segments: smsSegments(body),
    };
  }
}
