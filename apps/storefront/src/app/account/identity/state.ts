/**
 * What the three verification forms and their actions pass back and forth.
 *
 * Separate from `actions.ts` because a `'use server'` module may only export
 * async functions.
 *
 * A step keeps what was typed on a rejection. Somebody who mistyped one digit
 * of a twenty-four-digit account number should not have to find the card
 * again.
 */

export interface IdentityDraft {
  readonly nationalId: string;
  readonly birthDate: string;
}

export type StepState<Draft> =
  | { readonly status: 'idle'; readonly draft: Draft }
  | {
      readonly status: 'invalid';
      readonly message: string;
      readonly field: string;
      readonly draft: Draft;
    }
  /** The step was refused for a reason that is not about one field. */
  | { readonly status: 'blocked'; readonly message: string; readonly draft: Draft };

export const EMPTY_IDENTITY: IdentityDraft = { nationalId: '', birthDate: '' };

export interface BankDraft {
  readonly iban: string;
}

export const EMPTY_BANK: BankDraft = { iban: '' };

export interface SelfieDraft {
  readonly acknowledged: boolean;
}

export const EMPTY_SELFIE: SelfieDraft = { acknowledged: false };
