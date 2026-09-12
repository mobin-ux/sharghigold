/**
 * How a payment state reads on a page.
 *
 * Separate from the order state, which is where the *goods* are. An order can
 * be «در حال پردازش» with a payment that failed, and collapsing the two into
 * one badge is how a shop tells a customer their order is on its way when
 * nothing was ever charged.
 */
import type { OrderPaymentState } from '@sharghigold/contracts';

export const PAYMENT_STATE_LABEL: Record<OrderPaymentState, string> = {
  pending: 'در انتظار پرداخت',
  paid: 'پرداخت شده',
  failed: 'پرداخت ناموفق',
  canceled: 'لغو شده',
};

export const PAYMENT_STATE_TONE: Record<OrderPaymentState, 'good' | 'bad' | 'warn' | 'muted'> = {
  pending: 'warn',
  paid: 'good',
  failed: 'bad',
  canceled: 'muted',
};
