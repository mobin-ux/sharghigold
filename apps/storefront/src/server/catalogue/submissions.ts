/**
 * Where a customer's review or question goes.
 *
 * Server-only: it reads `API_INTERNAL_URL`, which is server configuration and
 * must never reach a client bundle. It is imported exclusively from Server
 * Actions.
 *
 * Nothing is stored yet: there is no reviews service and no session to attach
 * a submission to. Rather than pretend otherwise, this module makes the
 * absence explicit and the seam real.
 *
 * `submissionsEnabled()` is the switch. When `API_INTERNAL_URL` names a
 * running API, `postSubmission` sends the parsed payload to it; when it does
 * not, the action tells the customer that submissions are not open and the
 * page renders that state. A form that answers «ثبت شد» while writing to
 * nothing is worse than one that says it cannot take the message — the
 * customer walks away believing they have been heard.
 *
 * Two things this deliberately does not do:
 *
 * - It does not trust the caller. Every payload is parsed against the shared
 *   contract by the action *before* it gets here, and the API parses it again
 *   on arrival. A schema on the client is a convenience; the one on the server
 *   is the control (rules 6 and 9).
 * - It does not attach an identity. Reviews have to be tied to a paid order
 *   and questions to an account, and neither exists yet. Whatever lands here
 *   is anonymous, which is exactly why it must not be published.
 */

/** True when an API is configured to receive submissions. */
export function submissionsEnabled(): boolean {
  const base = process.env['API_INTERNAL_URL'];
  return typeof base === 'string' && base.trim() !== '';
}

export type SubmissionResult =
  | { readonly status: 'accepted' }
  | { readonly status: 'unavailable' }
  | { readonly status: 'failed' };

/**
 * Hand a validated payload to the API.
 *
 * The path is a fixed string chosen here, never anything derived from user
 * input, so no caller can steer the request. The base URL is server-side
 * configuration and is never sent to the browser.
 */
export async function postSubmission(
  path: '/api/v1/reviews' | '/api/v1/questions',
  payload: unknown,
): Promise<SubmissionResult> {
  const base = process.env['API_INTERNAL_URL'];

  if (base === undefined || base.trim() === '') return { status: 'unavailable' };

  try {
    const response = await fetch(new URL(path, base), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    return response.ok ? { status: 'accepted' } : { status: 'failed' };
  } catch {
    // The reason is deliberately dropped rather than returned. A fetch failure
    // carries the internal host and port, and that is not a customer's to see.
    return { status: 'failed' };
  }
}
