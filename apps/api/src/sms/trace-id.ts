/**
 * Our own reference for a message, generated before it is sent.
 *
 * The provider echoes it back on the delivery report, which is what lets a
 * receipt be matched to the dispatch that caused it without trusting the panel
 * to have kept our row id — and without a second round trip to ask.
 *
 * Two constraints shape it, and they nearly conflict.
 *
 * The vendor types the field as a signed 64-bit integer, and we hand it over
 * inside a JSON body. So it must also survive `JSON.stringify` and the panel's
 * own `JSON.parse` exactly, which caps it at 2^53 − 1 rather than at 2^63 − 1.
 * Anything larger would be silently rounded somewhere in the middle and come
 * back as a number that matches no dispatch we have.
 *
 * Within that ceiling the layout is milliseconds first, then randomness, so the
 * ids sort by time — useful when reading a log — while two messages sent in the
 * same millisecond still differ.
 */
import { randomInt } from 'node:crypto';

/** Random low-order part. Ten thousand values per millisecond. */
const SPREAD = 10_000;

/**
 * Milliseconds since the epoch, times `SPREAD`, plus noise.
 *
 * Counted from the Unix epoch this would already be about 1.8 × 10^16, past
 * `Number.MAX_SAFE_INTEGER`, so the epoch is shifted to the start of 2020.
 * That puts today's ids near 1.9 × 10^15 and leaves room until roughly 2048,
 * which the guard below turns into a loud failure rather than a silent
 * rounding if this outlives the estimate.
 */
const EPOCH_2020_MS = Date.UTC(2020, 0, 1);

export function newTraceId(now: Date = new Date()): string {
  const elapsed = Math.max(0, now.getTime() - EPOCH_2020_MS);
  const id = elapsed * SPREAD + randomInt(0, SPREAD);

  if (!Number.isSafeInteger(id)) {
    throw new RangeError('SMS trace id has outgrown the exactly-representable range');
  }

  return String(id);
}
