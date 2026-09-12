/**
 * Whether the development account store may be used at all.
 *
 * Every entry point in `store/` calls `assertAvailable()` first, which refuses
 * outright when `NODE_ENV` is `production`. The guard is derived from the
 * environment rather than from a flag somebody could set in a deployment — the
 * same construction `next.config.ts` uses to keep `unsafe-eval` out of a
 * production build.
 *
 * A production deployment that has not yet been pointed at the API therefore
 * refuses to sign anybody in, rather than handing out sessions from a map that
 * a restart erases and a second instance never sees.
 */

export class AccountsUnavailableError extends Error {
  override readonly name = 'AccountsUnavailableError';
}

/**
 * True when accounts can be served at all.
 *
 * Read by the sign-in page so it can say so plainly, instead of every action
 * below it failing one at a time.
 */
export function accountsAvailable(): boolean {
  return process.env.NODE_ENV !== 'production';
}

export function assertAvailable(): void {
  if (!accountsAvailable()) {
    throw new AccountsUnavailableError('The account store is not configured');
  }
}
