/**
 * What the rest of the API asks when it wants a message sent.
 *
 * The gateway below it knows one vendor's wire format; this knows the shop's
 * rules about messages. The split matters because the rules outlive the vendor:
 * that a login code goes through an approved template, that free text is capped
 * before it is billed, that a refusal is a value and an outage is an exception —
 * none of that changes when the panel does.
 *
 * What this deliberately does *not* own:
 *
 * **Rate limiting.** A login code is rate-limited by the flow that issues it,
 * keyed on the number, because that flow knows the difference between a resend
 * and a fresh request. A limit here as well would be a second budget with its
 * own opinion, and the two would disagree on the day it mattered.
 *
 * **Consent.** Whether a customer has opted out of marketing is a fact about
 * the customer, and it is checked where customers are read. This service is
 * told the purpose and enforces the one rule that has no exception — that
 * nothing calls it to send a one-time code except the flow that issued one.
 */
import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  maskIranianMobile,
  SMS_TEXT_MAX,
  smsSegments,
  type IranianMobile,
  type SmsAccountInfo,
  type SmsPurpose,
  type SmsSendResult,
  type SmsStatusQuery,
  type SmsStatusReport,
} from '@sharghigold/contracts';

import { SMS_GATEWAY, type SmsGateway } from './sms.port.js';
import { newTraceId } from './trace-id.js';

/** The knobs this service reads, narrowed from the environment. */
export interface SmsServiceConfig {
  /** The approved template a one-time code goes through, when there is one. */
  readonly otpTemplateKey: string | undefined;
}

export const SMS_SERVICE_CONFIG = Symbol('SMS_SERVICE_CONFIG');

/** What a caller must hand over to have a login code sent. */
export interface OtpMessage {
  readonly mobile: IranianMobile;
  /** The code itself. Never logged, never returned, never stored by this file. */
  readonly code: string;
  /** How long it stays valid, for the sentence the customer reads. */
  readonly expiresInMinutes: number;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(
    @Inject(SMS_GATEWAY) private readonly gateway: SmsGateway,
    @Inject(SMS_SERVICE_CONFIG) private readonly config: SmsServiceConfig,
  ) {}

  /* ------------------------------------------------------------------ */
  /* One-time codes                                                     */
  /* ------------------------------------------------------------------ */

  /**
   * Send a login code.
   *
   * Through the approved template when one is configured, which is required in
   * production. The free-text path below it exists so that development and
   * staging work before the panel's support desk has approved a template — it
   * is not a fallback anybody should be relying on in front of customers, and
   * `config/env.ts` makes sure they cannot be.
   *
   * Nothing about the outcome names the code, and the return value carries the
   * provider's identifiers only. A caller that wants to log this can log all of
   * it safely, which is the property that makes the rule easy to keep.
   */
  async sendOtp(message: OtpMessage): Promise<SmsSendResult> {
    const traceId = newTraceId();
    const templateKey = this.config.otpTemplateKey;

    const result =
      templateKey === undefined
        ? await this.gateway.sendText({
            mobile: message.mobile,
            text: otpFallbackText(message),
            traceId,
          })
        : await this.gateway.sendTemplate({
            mobile: message.mobile,
            templateKey,
            // Order is the template's, defined in the panel: the code first.
            parameters: [message.code, String(message.expiresInMinutes)],
            traceId,
          });

    if (result.status === 'refused') {
      this.logger.warn(
        `login code not sent to ${maskIranianMobile(message.mobile)}: ${result.reason}`,
      );
    }

    return result;
  }

  /* ------------------------------------------------------------------ */
  /* Everything else                                                    */
  /* ------------------------------------------------------------------ */

  /**
   * Send a message the shop composed: a dispatch notice, an instalment
   * reminder, a campaign.
   *
   * `purpose` cannot be `otp`. A general-purpose sender that could also deliver
   * a login code is a way to make somebody's phone ring with a code they did
   * not ask for, and to write one into a table staff can read.
   */
  async send(request: {
    readonly mobile: IranianMobile;
    readonly purpose: Exclude<SmsPurpose, 'otp'>;
    readonly text: string;
  }): Promise<SmsSendResult> {
    const text = request.text.trim();

    if (text === '' || text.length > SMS_TEXT_MAX) {
      // Refused rather than thrown: an over-long body is a bad request from a
      // caller, not a broken panel, and the caller has a response to write.
      this.logger.warn(
        `refusing a ${request.purpose} message of ${String(text.length)} characters`,
      );
      return { status: 'refused', reason: 'provider-rejected', retryable: false };
    }

    const traceId = newTraceId();
    const result = await this.gateway.sendText({ mobile: request.mobile, text, traceId });

    if (result.status === 'accepted') {
      this.logger.log(
        `${request.purpose} message accepted for ${maskIranianMobile(request.mobile)}: ` +
          `${String(result.segments)} segment(s), trace ${result.traceId}`,
      );
    }

    return result;
  }

  /** How many parts the operator will bill a message as, before sending it. */
  segmentsFor(text: string): number {
    return smsSegments(text);
  }

  /** What became of messages already sent. Safe to call repeatedly. */
  deliveryReports(query: SmsStatusQuery): Promise<readonly SmsStatusReport[]> {
    return this.gateway.deliveryReports(query);
  }

  /** Remaining credit and the lines the panel holds, for the admin dashboard. */
  accountInfo(): Promise<SmsAccountInfo> {
    return this.gateway.accountInfo();
  }
}

/**
 * The login code as free text, for panels with no approved template yet.
 *
 * Deliberately bare. It names no shop and quotes no address, because the
 * sending line identifies the sender and a message that reads like an
 * advertisement is a message an operator may treat as one. The trailing notice
 * is the one Iranian banks and shops all use, and it is the sentence a customer
 * scans for when somebody has called them and asked for the number.
 */
function otpFallbackText(message: OtpMessage): string {
  return [
    `کد ورود: ${message.code}`,
    `تا ${String(message.expiresInMinutes)} دقیقه معتبر است.`,
    'این کد را در اختیار کسی قرار ندهید.',
  ].join('\n');
}
