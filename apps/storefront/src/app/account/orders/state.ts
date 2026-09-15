/** What an order form shows after a submission that did not move the customer on. */
export type OrderFormState =
  { readonly status: 'idle' } | { readonly status: 'error'; readonly message: string };

export const ORDER_FORM_IDLE: OrderFormState = { status: 'idle' };
