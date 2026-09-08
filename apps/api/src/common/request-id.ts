/**
 * Correlation id for a single request.
 *
 * An upstream proxy may supply one; otherwise we mint it. The value is echoed
 * to the client in error responses so a customer can quote it to support
 * without the response carrying any internal detail.
 */

/**
 * What an inbound `X-Request-Id` is allowed to contain.
 *
 * The header is attacker-controlled, and the value reaches two places that both
 * care: the JSON error body, and the log line. JSON encoding makes the response
 * side safe on its own, but a log aggregator is not a JSON parser — a newline or
 * an ANSI escape in a correlation id is how a forged log entry gets written.
 * So the id is restricted to the character set real correlation ids actually
 * use (UUIDs, ULIDs, trace ids), and anything else is replaced rather than
 * sanitised: a request that supplies a malformed id gets a freshly minted one.
 */
const SAFE_REQUEST_ID = /^[A-Za-z0-9._:-]{1,128}$/;

export function readRequestId(headerValue: string | string[] | undefined): string {
  if (typeof headerValue === 'string' && SAFE_REQUEST_ID.test(headerValue)) {
    return headerValue;
  }
  return globalThis.crypto.randomUUID();
}
