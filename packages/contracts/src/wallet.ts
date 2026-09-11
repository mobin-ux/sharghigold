import { z } from 'zod';

import { positiveRialsStringSchema, uuidSchema } from './primitives.js';

/**
 * Topping the wallet up.
 *
 * Everything here is denominated in whole rials, held as a string of digits
 * because a bigint cannot cross the server/client boundary and must never
 * become a float on the way. The customer types tomans, because that is what
 * an Iranian shop quotes; the conversion happens once, on the server, as an
 * integer multiplication.
 *
 * The limits are the design's, restated in rials: fifty thousand tomans at the
 * bottom and five hundred million at the top.
 */
export const TOP_UP_MIN_RIALS = 500_000n;
export const TOP_UP_MAX_RIALS = 5_000_000_000n;

/** The amounts the design offers as chips, in rials. */
export const TOP_UP_QUICK_RIALS: readonly bigint[] = [
  10_000_000n,
  50_000_000n,
  100_000_000n,
  200_000_000n,
];

/**
 * The amount as it leaves the form: a string of Latin digits, in tomans.
 *
 * Bounded to twelve digits before it is ever turned into a number, so a field
 * pasted full of digits cannot become an allocation. The range is checked
 * against the rial limits above, after conversion, by the server — not here,
 * because the message a customer should read differs between «too small» and
 * «too large» and a schema that returns one refusal cannot say which.
 */
export const topUpTomanSchema = z
  .string()
  .trim()
  .regex(/^\d{1,12}$/, { message: 'مبلغ را به عدد وارد کنید' });

/** How the money is being sent. Only the first is built. */
export const paymentMethodSchema = z.enum(['gateway', 'card-to-card']);

export type PaymentMethod = z.output<typeof paymentMethodSchema>;

/**
 * Where a payment has got to.
 *
 * `pending` is the only non-terminal one, and it means two different things at
 * different moments: the customer is still at the bank, or the bank has taken
 * the money and not yet said so. Both are «we do not know yet», and neither
 * may credit the wallet.
 */
export const paymentStatusSchema = z.enum(['pending', 'succeeded', 'failed', 'canceled']);

export type PaymentStatus = z.output<typeof paymentStatusSchema>;

/**
 * What the receipt screen is allowed to know.
 *
 * `balanceAfterRials` is the balance the ledger held once this payment was
 * applied, recorded at settlement rather than recomputed for display. A
 * receipt that recalculates a balance is a receipt that changes after the
 * fact.
 */
export const topUpReceiptSchema = z.object({
  id: uuidSchema,
  /** The number a customer reads out to support. Issued by the server. */
  reference: z.string().regex(/^\d{8}$/, { message: 'شماره پیگیری معتبر نیست' }),
  amountRials: positiveRialsStringSchema,
  method: paymentMethodSchema,
  status: paymentStatusSchema,
  createdAt: z.iso.datetime(),
  settledAt: z.iso.datetime().nullable(),
  balanceAfterRials: positiveRialsStringSchema.nullable(),
});

export type TopUpReceipt = z.output<typeof topUpReceiptSchema>;

/** The wallet as the top-up screen shows it: money and metal, side by side. */
export const walletStateSchema = z.object({
  balanceRials: positiveRialsStringSchema,
  goldMilligrams: z.string().regex(/^\d+$/),
});

export type WalletState = z.output<typeof walletStateSchema>;
