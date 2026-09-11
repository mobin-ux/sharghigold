/**
 * What the sign-in forms and their actions pass back and forth.
 *
 * A separate module from `actions.ts` because a `'use server'` file may only
 * export async functions: a type or a constant exported from one is replaced
 * with a client reference, and a constant arrives as `undefined`.
 *
 * Every state carries back what the customer typed, except the fields that are
 * secrets. A rejected password form comes back empty on purpose — restoring a
 * password into the DOM puts it in the page source, in the browser's form
 * cache and in any screenshot of the failure.
 */

export type MobileState =
  | { readonly status: 'idle'; readonly mobile: string }
  /** The number is not one. */
  | { readonly status: 'invalid'; readonly message: string; readonly mobile: string }
  /** Too many codes asked for. `message` says when to come back. */
  | { readonly status: 'throttled'; readonly message: string; readonly mobile: string }
  /** Accounts cannot be served at all in this deployment. */
  | { readonly status: 'unavailable'; readonly mobile: string };

export const EMPTY_MOBILE: MobileState = { status: 'idle', mobile: '' };

export type CodeState =
  | { readonly status: 'idle' }
  /**
   * The code did not check out. The message says what to do next — retype or
   * ask for a new one — and never whether the number has an account.
   */
  | { readonly status: 'error'; readonly message: string };

export const EMPTY_CODE: CodeState = { status: 'idle' };

export type PasswordState =
  { readonly status: 'idle' } | { readonly status: 'error'; readonly message: string };

export const EMPTY_PASSWORD: PasswordState = { status: 'idle' };
