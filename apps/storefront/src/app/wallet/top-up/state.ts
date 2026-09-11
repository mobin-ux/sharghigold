import type { PaymentMethod } from '@sharghigold/contracts';

/**
 * What the amount form and its action pass back and forth.
 *
 * Separate from `actions.ts` because a `'use server'` module may only export
 * async functions.
 */

export interface TopUpDraft {
  /** Latin digits, in tomans, exactly as the field holds them. */
  readonly toman: string;
  readonly method: PaymentMethod;
}

export type TopUpState =
  | { readonly status: 'idle'; readonly draft: TopUpDraft }
  | { readonly status: 'invalid'; readonly message: string; readonly draft: TopUpDraft }
  /* Payments are not being taken at all. Said once, where the button is. */
  | { readonly status: 'unavailable'; readonly draft: TopUpDraft };

export const EMPTY_TOP_UP: TopUpDraft = { toman: '', method: 'gateway' };

export const EMPTY_TOP_UP_STATE: TopUpState = { status: 'idle', draft: EMPTY_TOP_UP };
