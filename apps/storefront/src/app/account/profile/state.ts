/**
 * What the profile form and its action pass back and forth.
 *
 * Separate from `actions.ts` because a `'use server'` module may only export
 * async functions.
 */

export interface ProfileDraft {
  readonly displayName: string;
  readonly nationalId: string;
}

export type ProfileState =
  | { readonly status: 'idle'; readonly draft: ProfileDraft }
  | {
      readonly status: 'invalid';
      readonly message: string;
      /** Which field the message belongs under. */
      readonly field: 'displayName' | 'nationalId';
      readonly draft: ProfileDraft;
    };

export const EMPTY_PROFILE: ProfileDraft = { displayName: '', nationalId: '' };
