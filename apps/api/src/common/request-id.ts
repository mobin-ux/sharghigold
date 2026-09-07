/**
 * Correlation id for a single request.
 *
 * An upstream proxy may supply one; otherwise we mint it. The value is echoed
 * to the client in error responses so a customer can quote it to support
 * without the response carrying any internal detail.
 */
export function readRequestId(headerValue: string | string[] | undefined): string {
  if (typeof headerValue === 'string' && headerValue.length > 0 && headerValue.length <= 128) {
    return headerValue;
  }
  return globalThis.crypto.randomUUID();
}
