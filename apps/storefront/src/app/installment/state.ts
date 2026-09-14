/** What the callback panel shows after a submission. */
export type CallbackState =
  | { readonly status: 'idle' }
  | { readonly status: 'done'; readonly message: string }
  | { readonly status: 'error'; readonly message: string };

export const CALLBACK_IDLE: CallbackState = { status: 'idle' };
