/**
 * What the discount-code form and its action pass back and forth.
 *
 * Its own module because a `'use server'` file may only export async
 * functions, and because the shape is shared by the form and the page that
 * renders it.
 */

export type CodeState =
  | { readonly status: 'idle'; readonly code: string }
  | { readonly status: 'applied'; readonly label: string; readonly code: string }
  | { readonly status: 'invalid'; readonly message: string; readonly code: string };

export const EMPTY_CODE_STATE: CodeState = { status: 'idle', code: '' };
