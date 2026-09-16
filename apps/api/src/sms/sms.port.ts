/**
 * The seam the SMS panel arrives through.
 *
 * Written in the vocabulary of `@sharghigold/contracts`, never in the vendor's:
 * no `ApiKey`, no `TemplateKey`, no `UserTraceId` as a number. Swapping
 * sms-webservice.com for another reseller should be one new file implementing
 * this interface and one line of configuration, and it will be exactly that for
 * as long as nothing above this seam learns a vendor's field name.
 *
 * Three rules every implementation holds to, none of which is visible in a
 * type:
 *
 * **A send is not retried.** Not here, not by the caller. The provider's
 * acknowledgement is the only evidence a message was accepted, and a request
 * that times out may have been accepted anyway — retrying it sends a second
 * message, bills for it, and delivers two different login codes to somebody
 * trying to sign in. Reads may be retried, because asking twice costs nothing.
 *
 * **A refusal is a value; a breakage is a throw.** A number the operator will
 * not deliver to is an ordinary `refused` result the caller handles. A panel
 * that cannot be reached at all is an exception, because the two want different
 * responses and collapsing them makes an outage look like a bad phone number.
 *
 * **Nothing here logs a message body.** The one-time code is inside it.
 */
import type {
  IranianMobile,
  SmsAccountInfo,
  SmsSendResult,
  SmsStatusQuery,
  SmsStatusReport,
} from '@sharghigold/contracts';

/** A message whose text we wrote ourselves. */
export interface OutboundText {
  readonly mobile: IranianMobile;
  readonly text: string;
  /** Our reference, echoed back with the delivery report. */
  readonly traceId: string;
}

/**
 * A message assembled by the provider from a template it has approved.
 *
 * One-time codes go this way and free text does not, for two reasons that are
 * both about the code arriving. Iranian operators carry template traffic on
 * service lines, which are exempt from the advertising blocks and opt-outs that
 * silently swallow a message sent from a 5000-prefixed line; and the panel
 * picks the fastest line it holds at that moment rather than a line we named
 * when this was configured.
 */
export interface OutboundTemplate {
  readonly mobile: IranianMobile;
  readonly templateKey: string;
  /** Substituted into the template in order. At most ten, per the vendor. */
  readonly parameters: readonly string[];
  readonly traceId: string;
}

export interface SmsGateway {
  /**
   * Send text we composed, over the configured line.
   *
   * For anything that is not a one-time code. Resolves with `refused` when the
   * provider declines; throws when it could not be asked.
   */
  sendText(message: OutboundText): Promise<SmsSendResult>;

  /** Send through an approved template. The path a login code takes. */
  sendTemplate(message: OutboundTemplate): Promise<SmsSendResult>;

  /**
   * Ask what became of messages already sent.
   *
   * Idempotent, so this one may be retried. Entries the provider does not
   * recognise come back as `unknown` rather than being dropped, so the caller
   * can tell «not delivered» from «not answered».
   */
  deliveryReports(query: SmsStatusQuery): Promise<readonly SmsStatusReport[]>;

  /** Remaining credit and the lines the panel currently holds. */
  accountInfo(): Promise<SmsAccountInfo>;
}

/** Injection token. Nest cannot inject an interface, so the token is the name. */
export const SMS_GATEWAY = Symbol('SMS_GATEWAY');
