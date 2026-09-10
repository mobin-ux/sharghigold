/**
 * What the review form and its action pass back and forth.
 *
 * A separate module from `actions.ts` because a `'use server'` file may only
 * export async functions: anything else exported from one is replaced with a
 * reference the client cannot call, and a constant exported from there arrives
 * as `undefined`.
 */

export interface ReviewDraft {
  readonly stars: number;
  readonly title: string;
  readonly body: string;
  /** Star counts by aspect key. Empty until the customer scores one. */
  readonly aspects: Readonly<Record<string, number>>;
  readonly acceptsPolicy: boolean;
}

/**
 * The outcome of a submission.
 *
 * A discriminated union rather than a thrown error: «you missed a field», «we
 * cannot take this yet» and «it is published» are three different things, and
 * the page says something different about each.
 */
export type WriteState =
  | { readonly status: 'idle'; readonly draft: ReviewDraft }
  | { readonly status: 'invalid'; readonly message: string; readonly draft: ReviewDraft }
  | { readonly status: 'unavailable'; readonly draft: ReviewDraft }
  | { readonly status: 'accepted' };

export const EMPTY_DRAFT: ReviewDraft = {
  stars: 0,
  title: '',
  body: '',
  aspects: {},
  acceptsPolicy: false,
};
