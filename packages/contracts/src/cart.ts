import { z } from 'zod';

import { goldColourSchema } from './product.js';
import {
  milligramsStringSchema,
  positiveRialsStringSchema,
  slugSchema,
  userTextSchema,
  uuidSchema,
} from './primitives.js';

/**
 * The basket, and the order it becomes.
 *
 * The rule that shapes every schema below: **a cart line carries what was
 * chosen, never what it costs.** A line is a product, a size, a colour and a
 * quantity. Every rial in this file is produced by the server from those
 * choices and today's gold rate, and is marked as output — nothing here
 * describes a price a browser is allowed to send.
 *
 * That is not caution for its own sake. A basket is the one place in a shop
 * where a customer controls the input and the output is money, so a schema
 * that accepted `lineTotalRials` would be a schema that accepted a discount of
 * the customer's choosing (rules 5, 15 and 17).
 *
 * Amounts are strings of digits because they are whole rials held as `bigint`
 * on the server, and a bigint cannot cross to a client without becoming a
 * float on the way.
 */

/* -------------------------------------------------------------------------- */
/* Limits                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * How many distinct lines one basket may hold, and how many of one piece.
 *
 * Both are bounds on work the server does per request rather than merchandising
 * rules: a basket is re-quoted in full on every render, so an unbounded one is
 * an unbounded computation anybody can ask for. The per-line cap is a second
 * floor under the stock check, which is the real limit.
 */
export const CART_MAX_LINES = 20;
export const CART_MAX_QUANTITY = 10;

/* -------------------------------------------------------------------------- */
/* What goes in                                                               */
/* -------------------------------------------------------------------------- */

export const cartQuantitySchema = z.coerce
  .number()
  .int({ message: 'تعداد باید عدد صحیح باشد' })
  .min(1, { message: 'تعداد باید دست‌کم یک باشد' })
  .max(CART_MAX_QUANTITY, { message: 'تعداد بیش از حد مجاز است' });

/**
 * Putting a piece in the basket.
 *
 * The size is a number in the shop's own system and may be absent — a necklace
 * has no size — so `null` is a value here and not a missing field. Whether the
 * size can actually be ordered is decided by the server against the product,
 * exactly as `productSizeSchema` warns: a disabled option is not stock control.
 */
export const addToCartSchema = z.object({
  productSlug: slugSchema,
  size: z.coerce.number().int().min(1).max(200).nullable(),
  colour: goldColourSchema,
  quantity: cartQuantitySchema,
});

export type AddToCartInput = z.output<typeof addToCartSchema>;

/**
 * A discount code as it leaves the field.
 *
 * Upper-cased before matching, because a code is read off a banner and typed
 * in whatever case the keyboard was in. Restricted to Latin letters and digits
 * so that the value is only ever a key into a table the shop owns — it is
 * never interpolated into anything.
 */
export const discountCodeSchema = z
  .string()
  .trim()
  .transform((value) => value.toUpperCase())
  .refine((value) => /^[A-Z0-9]{4,24}$/.test(value), { message: 'کد تخفیف معتبر نیست' });

/* -------------------------------------------------------------------------- */
/* What comes back                                                            */
/* -------------------------------------------------------------------------- */

/**
 * One line of the basket, priced.
 *
 * `unitTotalRials` is what one of these costs today and `lineTotalRials` is
 * what the whole line costs; the second is not the first multiplied in the
 * browser, because rounding a unit and then multiplying is how a line total
 * stops matching the sum of the breakdown.
 *
 * `stockRemaining` is what the shop actually has, so the page can say «تنها ۳
 * عدد مانده» and cap the stepper. The cap is a courtesy: the quantity is
 * checked against stock again when the order is placed.
 */
export const cartLineSchema = z.object({
  id: uuidSchema,
  productSlug: slugSchema,
  title: userTextSchema(140),
  sku: z.string().max(32),
  mediaId: z.string().max(64),
  size: z.int().min(1).max(200).nullable(),
  colour: goldColourSchema,
  colourLabel: userTextSchema(24),
  quantity: cartQuantitySchema,
  /** Weight of the whole line, for the «وزن کل» figure. */
  weightMilligrams: milligramsStringSchema,
  unitTotalRials: positiveRialsStringSchema,
  lineTotalRials: positiveRialsStringSchema,
  stockRemaining: z.int().min(0),
  /** True when the line can still be ordered at this quantity. */
  orderable: z.boolean(),
});

export type CartLine = z.output<typeof cartLineSchema>;

/** A piece set aside for later. It has no quantity and is not being bought. */
export const savedLineSchema = z.object({
  id: uuidSchema,
  productSlug: slugSchema,
  title: userTextSchema(140),
  mediaId: z.string().max(64),
  size: z.int().min(1).max(200).nullable(),
  colour: goldColourSchema,
  colourLabel: userTextSchema(24),
  unitTotalRials: positiveRialsStringSchema,
  orderable: z.boolean(),
});

export type SavedLine = z.output<typeof savedLineSchema>;

/* -------------------------------------------------------------------------- */
/* Discounts                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * What a code does.
 *
 * `making-fee` takes a percentage off the making fee only, which is the one
 * part of an Iranian gold price a shop can actually discount — the gold itself
 * is the market's and the VAT is the state's. `gift-card` is a flat amount.
 * A code that took a percentage off the whole total would be a code that sells
 * gold below the rate.
 */
export const discountKindSchema = z.enum(['making-fee', 'gift-card']);

export type DiscountKind = z.output<typeof discountKindSchema>;

export const appliedDiscountSchema = z.object({
  code: z.string().max(24),
  kind: discountKindSchema,
  label: userTextSchema(80),
  amountRials: positiveRialsStringSchema,
});

export type AppliedDiscount = z.output<typeof appliedDiscountSchema>;

/* -------------------------------------------------------------------------- */
/* Delivery and payment                                                       */
/* -------------------------------------------------------------------------- */

export const deliveryModeSchema = z.enum(['ship', 'pickup']);

export type DeliveryMode = z.output<typeof deliveryModeSchema>;

export const shippingMethodSchema = z.enum(['post', 'courier']);

export type ShippingMethod = z.output<typeof shippingMethodSchema>;

/**
 * How the order is paid for.
 *
 * Distinct from `paymentMethodSchema` in `wallet.ts`, which names how money
 * gets *into* the wallet. This names where an order's money comes *from*, and
 * the wallet is one of the answers.
 */
export const checkoutPaymentSchema = z.enum(['gateway', 'wallet', 'installment']);

export type CheckoutPayment = z.output<typeof checkoutPaymentSchema>;

export const invoiceTypeSchema = z.enum(['personal', 'official']);

export type InvoiceType = z.output<typeof invoiceTypeSchema>;

/**
 * The company an official invoice is made out to.
 *
 * The economic code is ten to sixteen digits depending on which the company
 * holds, so the bound is a range and the exact figure is the tax office's to
 * reject. Latin digits: this is a number, and the server normalises Persian
 * numerals before it gets here.
 */
export const companyDetailsSchema = z.object({
  name: userTextSchema(120).refine((value) => value.length >= 3, {
    message: 'نام شرکت را کامل وارد کنید',
  }),
  economicCode: z
    .string()
    .trim()
    .refine((value) => /^\d{10,16}$/.test(value), {
      message: 'شناسه ملی یا کد اقتصادی معتبر نیست',
    }),
});

export type CompanyDetails = z.output<typeof companyDetailsSchema>;

/** A recipient who is not the account holder. */
export const otherRecipientSchema = z.object({
  name: userTextSchema(80).refine((value) => value.length >= 3, {
    message: 'نام گیرنده را کامل وارد کنید',
  }),
  mobile: z
    .string()
    .trim()
    .refine((value) => /^09\d{9}$/.test(value), { message: 'شماره موبایل گیرنده معتبر نیست' }),
});

export type OtherRecipient = z.output<typeof otherRecipientSchema>;

export const ORDER_NOTE_MAX = 400;

export const orderNoteSchema = z.string().trim().max(ORDER_NOTE_MAX);

/* -------------------------------------------------------------------------- */
/* The bill                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * One line of «جزئیات قیمت».
 *
 * A key and an amount, never a sentence and a colour. The storefront decides
 * that a discount is written in green and that «رایگان» replaces a zero;
 * sending either would let whatever fills this object choose what a customer's
 * page says (rules 7 and 10).
 */
export const billLineKindSchema = z.enum([
  'gold-value',
  'making-fee',
  'profit',
  'vat',
  'discount',
  'gift-wrap',
  'shipping',
  'pickup',
]);

export type BillLineKind = z.output<typeof billLineKindSchema>;

export const billLineSchema = z.object({
  kind: billLineKindSchema,
  /** Negative for a discount, which is why this is the signed schema. */
  amountRials: z.string().regex(/^-?\d+$/),
  /** Set where the line quotes a rate or a name the label has to carry. */
  detail: z.string().max(80).nullable(),
});

export type BillLine = z.output<typeof billLineSchema>;

/**
 * What the basket comes to.
 *
 * `payNowRials` is not always `totalRials`: an instalment purchase asks for the
 * deposit today. Both are computed by the server and carried separately, so no
 * screen has to work out which figure its button is about.
 */
export const cartTotalsSchema = z.object({
  weightMilligrams: milligramsStringSchema,
  lines: z.array(billLineSchema).max(12),
  itemsRials: positiveRialsStringSchema,
  discountRials: positiveRialsStringSchema,
  shippingRials: positiveRialsStringSchema,
  giftRials: positiveRialsStringSchema,
  totalRials: positiveRialsStringSchema,
  payNowRials: positiveRialsStringSchema,
});

export type CartTotals = z.output<typeof cartTotalsSchema>;

/**
 * An instalment offer, priced.
 *
 * Every figure is the server's. The deposit is taken today, the balance is
 * spread over the term with the shop's surcharge on it, and `totalRials` is
 * what the purchase costs in the end — which is more than the cash price and
 * has to be shown as such.
 */
export const installmentOfferSchema = z.object({
  months: z.int().min(1).max(60),
  depositRials: positiveRialsStringSchema,
  monthlyRials: positiveRialsStringSchema,
  totalRials: positiveRialsStringSchema,
});

export type InstallmentOffer = z.output<typeof installmentOfferSchema>;

/* -------------------------------------------------------------------------- */
/* The basket as a screen sees it                                             */
/* -------------------------------------------------------------------------- */

export const cartViewSchema = z.object({
  lines: z.array(cartLineSchema).max(CART_MAX_LINES),
  saved: z.array(savedLineSchema).max(CART_MAX_LINES),
  itemCount: z.int().min(0),
  discount: appliedDiscountSchema.nullable(),
  totals: cartTotalsSchema,
  /** The gold rate this basket was priced at, and when it stops being honoured. */
  pricePerGramRials: positiveRialsStringSchema,
  quotedAt: z.iso.datetime(),
  expiresAt: z.iso.datetime(),
  secondsRemaining: z.int().min(0),
});

export type CartView = z.output<typeof cartViewSchema>;

/* -------------------------------------------------------------------------- */
/* The order                                                                  */
/* -------------------------------------------------------------------------- */

export const orderCodeSchema = z
  .string()
  .regex(/^ZN-\d{5,10}$/, { message: 'شماره سفارش معتبر نیست' });

/**
 * Where an order's money has got to.
 *
 * Separate from `orderStateSchema`, which is where the *goods* have got to. An
 * order is only worked on once its payment says `paid`, and the two were one
 * field in the design — which is how an unpaid order ends up in a workshop.
 */
export const orderPaymentStateSchema = z.enum(['pending', 'paid', 'failed', 'canceled']);

export type OrderPaymentState = z.output<typeof orderPaymentStateSchema>;

/**
 * What the result screen and the order list are allowed to know.
 *
 * Every amount is the snapshot written when the order was placed, never a
 * figure recomputed from today's rate. An order from August must still say
 * what August cost, whatever gold has done since.
 */
export const placedOrderSchema = z.object({
  code: orderCodeSchema,
  placedAt: z.iso.datetime(),
  paymentState: orderPaymentStateSchema,
  payment: checkoutPaymentSchema,
  paymentLabel: userTextSchema(80),
  totalRials: positiveRialsStringSchema,
  paidRials: positiveRialsStringSchema,
  itemCount: z.int().min(1).max(200),
  deliveryMode: deliveryModeSchema,
  deliveryLabel: userTextSchema(120),
  /** The bank's own reference, when there was a bank. */
  reference: z.string().max(24).nullable(),
  /** Why it failed, as a key the storefront turns into a sentence. */
  failureReason: z.enum(['declined', 'abandoned', 'insufficient-funds']).nullable(),
});

export type PlacedOrder = z.output<typeof placedOrderSchema>;
