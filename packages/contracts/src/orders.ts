/**
 * An order as its owner follows it: the list, the file behind one order, and
 * the few things a customer may ask the shop to do with it.
 *
 * The account's order card (`account.ts`) is what the account home shows.
 * This is the rest of the story — the pieces and what each cost, the bill, the
 * payment, the parcel's movements, instalments, a cancellation, a return, a
 * review and the conversation with support.
 *
 * Every amount is the one frozen when the order was placed. Every «may I»
 * flag is decided on the server from the order's own state, and every input
 * here is re-checked against that state when it arrives: a flag tells the page
 * what to draw, never what to allow.
 */
import { z } from 'zod';

import { orderStateSchema } from './account.js';
import { checkoutPaymentSchema, deliveryModeSchema, orderCodeSchema } from './cart.js';
import { goldColourSchema, starRatingSchema } from './product.js';
import {
  iranianMobileSchema,
  milligramsStringSchema,
  positiveRialsStringSchema,
  rialsStringSchema,
  userTextSchema,
} from './primitives.js';
import { REVIEW_BODY_MAX } from './reviews.js';

/* -------------------------------------------------------------------------- */
/* The list                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * The chips above the list.
 *
 * A return is not a parcel state — a delivered order has one — so «مرجوعی» is
 * its own group rather than a fifth value of `orderStateSchema`.
 */
export const orderGroupSchema = z.enum([
  'all',
  'processing',
  'shipped',
  'delivered',
  'returns',
  'cancelled',
]);

export type OrderGroup = z.output<typeof orderGroupSchema>;

export const ORDER_SEARCH_MAX = 40;

/**
 * The list's query string: a group and a search term.
 *
 * Closed like every other query parser. An unknown group is the whole list,
 * and a term that fails the text rules is no search rather than an error — a
 * link anybody can write must not be a way to break somebody's order page.
 */
export const orderListQuerySchema = z.object({
  filter: orderGroupSchema.catch('all'),
  q: userTextSchema(ORDER_SEARCH_MAX).optional().catch(undefined),
});

export type OrderListQuery = z.output<typeof orderListQuerySchema>;

/** A repeated parameter is not a value anybody meant; only a single string counts. */
function single(value: string | readonly string[] | undefined): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

export function parseOrderListQuery(
  params: Readonly<Record<string, string | readonly string[] | undefined>>,
): OrderListQuery {
  return orderListQuerySchema.parse({ filter: single(params['filter']), q: single(params['q']) });
}

/* -------------------------------------------------------------------------- */
/* What the customer may choose                                               */
/* -------------------------------------------------------------------------- */

/** Why an order is being cancelled. Keys; the storefront writes the words. */
export const cancelReasonSchema = z.enum([
  'not-needed',
  'better-price',
  'wrong-choice',
  'slow-delivery',
  'change-order',
]);

export type CancelReason = z.output<typeof cancelReasonSchema>;

export const returnReasonSchema = z.enum([
  'photo-mismatch',
  'size',
  'damaged',
  'weight-mismatch',
  'changed-mind',
]);

export type ReturnReason = z.output<typeof returnReasonSchema>;

/**
 * Where a refund goes.
 *
 * `bank` means the IBAN already verified on the account, never a number typed
 * into the return form: a refund destination chosen per request is the field
 * somebody else's account number gets pasted into.
 */
export const refundDestinationSchema = z.enum(['wallet', 'bank']);

export type RefundDestination = z.output<typeof refundDestinationSchema>;

export const reviewTagSchema = z.enum([
  'clean-finish',
  'photo-match',
  'packaging',
  'fast-delivery',
  'fair-fee',
]);

export type ReviewTag = z.output<typeof reviewTagSchema>;

/* -------------------------------------------------------------------------- */
/* The order file                                                             */
/* -------------------------------------------------------------------------- */

export const orderLineSchema = z.object({
  /** Position in the order, which is how the return form names a piece. */
  index: z.int().min(0).max(49),
  /** The catalogue entry, when the piece is still sold. */
  productSlug: z.string().max(160).nullable(),
  title: userTextSchema(120),
  size: z.int().min(1).max(200).nullable(),
  colour: goldColourSchema.nullable(),
  weightMilligrams: milligramsStringSchema,
  quantity: z.int().min(1).max(50),
  /** What the line came to, every unit included. */
  totalRials: positiveRialsStringSchema,
});

export type OrderLine = z.output<typeof orderLineSchema>;

/** The bill, part by part. The parts add to `totalRials` exactly. */
export const orderBillSchema = z.object({
  weightMilligrams: milligramsStringSchema,
  goldValueRials: rialsStringSchema,
  makingFeeRials: rialsStringSchema,
  profitRials: rialsStringSchema,
  vatRials: rialsStringSchema,
  discountRials: rialsStringSchema,
  shippingRials: rialsStringSchema,
  giftRials: rialsStringSchema,
  totalRials: positiveRialsStringSchema,
});

export type OrderBill = z.output<typeof orderBillSchema>;

export const instalmentSchema = z.object({
  /** 1-based, as the customer counts them. */
  number: z.int().min(1).max(60),
  dueAt: z.iso.datetime(),
  amountRials: positiveRialsStringSchema,
  paidAt: z.iso.datetime().nullable(),
});

export type Instalment = z.output<typeof instalmentSchema>;

export const instalmentPlanSchema = z.object({
  months: z.int().min(1).max(60),
  depositRials: rialsStringSchema,
  schedule: z.array(instalmentSchema).min(1).max(60),
});

export type OrderInstalmentPlan = z.output<typeof instalmentPlanSchema>;

/** Something that happened to an order, or is expected to. */
export const orderEventKindSchema = z.enum([
  'placed',
  'paid',
  'credit-approved',
  'preparing',
  'handed-to-carrier',
  'at-hub',
  'out-for-delivery',
  'ready-for-pickup',
  'delivered',
  'cancelled',
  'refunded',
  'return-requested',
  'return-reviewed',
  'return-collected',
  'return-refunded',
  'return-withdrawn',
]);

export type OrderEventKind = z.output<typeof orderEventKindSchema>;

export const orderEventSchema = z.object({
  kind: orderEventKindSchema,
  /** Null for a step still to come. */
  at: z.iso.datetime().nullable(),
  note: userTextSchema(160).nullable(),
});

export type OrderEvent = z.output<typeof orderEventSchema>;

export const orderDeliverySchema = z.object({
  mode: deliveryModeSchema,
  /** «پست پیشتاز بیمه‌شده», or the branch a pickup is from. */
  methodLabel: userTextSchema(120),
  recipientName: userTextSchema(80).nullable(),
  recipientMobile: iranianMobileSchema.nullable(),
  addressLine: userTextSchema(240).nullable(),
  postalCode: z
    .string()
    .regex(/^\d{10}$/)
    .nullable(),
});

export const orderShipmentSchema = z.object({
  carrier: userTextSchema(60).nullable(),
  trackingCode: z
    .string()
    .regex(/^\d{8,24}$/)
    .nullable(),
  estimatedAt: z.iso.datetime().nullable(),
  deliveredAt: z.iso.datetime().nullable(),
  /** What has happened, oldest first, then what is still to come. */
  events: z.array(orderEventSchema).max(20),
});

export const orderCancellationSchema = z.object({
  reason: cancelReasonSchema,
  at: z.iso.datetime(),
  refundRials: rialsStringSchema,
});

/**
 * How far a return has got.
 *
 * `reviewing` is where every request starts: nothing is collected before a
 * person has read it. `withdrawn` is the customer changing their mind.
 */
export const returnStageSchema = z.enum([
  'reviewing',
  'collecting',
  'inspecting',
  'refunded',
  'withdrawn',
]);

export type ReturnStage = z.output<typeof returnStageSchema>;

export const orderReturnSchema = z.object({
  code: z.string().regex(/^RT-\d{5,10}$/),
  stage: returnStageSchema,
  lineIndexes: z.array(z.int().min(0).max(49)).min(1).max(50),
  reason: returnReasonSchema,
  refundTo: refundDestinationSchema,
  refundRials: positiveRialsStringSchema,
  requestedAt: z.iso.datetime(),
});

export type OrderReturn = z.output<typeof orderReturnSchema>;

export const orderReviewSchema = z.object({
  /** One rating per line, in line order. */
  ratings: z.array(starRatingSchema).min(1).max(50),
  submittedAt: z.iso.datetime(),
});

export const orderMessageSchema = z.object({
  from: z.enum(['customer', 'shop']),
  body: userTextSchema(500),
  at: z.iso.datetime(),
});

export type OrderMessage = z.output<typeof orderMessageSchema>;

/** What the page may offer. Decided on the server; re-checked on every write. */
export const orderAllowancesSchema = z.object({
  cancel: z.boolean(),
  requestReturn: z.boolean(),
  review: z.boolean(),
  reorder: z.boolean(),
  payInstalment: z.boolean(),
  /** Whether the account has a verified IBAN a refund could go to. */
  refundToBank: z.boolean(),
});

export type OrderAllowances = z.output<typeof orderAllowancesSchema>;

export const orderFileSchema = z.object({
  code: orderCodeSchema,
  placedAt: z.iso.datetime(),
  state: orderStateSchema,
  /** The 18-karat rate per gram the order was priced at. */
  ratePerGramRials: positiveRialsStringSchema.nullable(),
  lines: z.array(orderLineSchema).min(1).max(50),
  bill: orderBillSchema,
  payment: z.object({
    method: checkoutPaymentSchema,
    label: userTextSchema(80),
    reference: z.string().max(24).nullable(),
    paidAt: z.iso.datetime().nullable(),
    paidRials: rialsStringSchema,
  }),
  instalments: instalmentPlanSchema.nullable(),
  delivery: orderDeliverySchema,
  shipment: orderShipmentSchema,
  cancellation: orderCancellationSchema.nullable(),
  returnRequest: orderReturnSchema.nullable(),
  review: orderReviewSchema.nullable(),
  messages: z.array(orderMessageSchema).max(200),
  allowed: orderAllowancesSchema,
});

export type OrderFile = z.output<typeof orderFileSchema>;

/* -------------------------------------------------------------------------- */
/* Requests                                                                   */
/* -------------------------------------------------------------------------- */

export const ORDER_NOTE_LIMIT = 300;

/** An optional free-text note: blank is no note, not an error. */
const optionalNote = (max: number) =>
  z
    .string()
    .max(max * 2)
    .optional()
    .transform((value) => (value ?? '').trim())
    .pipe(z.union([z.literal(''), userTextSchema(max)]))
    .transform((value) => (value === '' ? null : value));

export const cancelOrderSchema = z.object({
  code: orderCodeSchema,
  reason: cancelReasonSchema,
  note: optionalNote(ORDER_NOTE_LIMIT),
});

export type CancelOrderInput = z.output<typeof cancelOrderSchema>;

export const returnOrderSchema = z.object({
  code: orderCodeSchema,
  lines: z
    .array(z.coerce.number().int().min(0).max(49))
    .min(1, { message: 'دست‌کم یک کالا را انتخاب کنید' })
    .max(50)
    .refine((values) => new Set(values).size === values.length),
  reason: returnReasonSchema,
  refundTo: refundDestinationSchema,
  note: optionalNote(ORDER_NOTE_LIMIT),
});

export type ReturnOrderInput = z.output<typeof returnOrderSchema>;

export const reviewOrderSchema = z.object({
  code: orderCodeSchema,
  ratings: z.array(z.coerce.number().pipe(starRatingSchema)).min(1).max(50),
  body: optionalNote(REVIEW_BODY_MAX),
  tags: z
    .array(reviewTagSchema)
    .max(reviewTagSchema.options.length)
    .refine((values) => new Set(values).size === values.length),
  anonymous: z.boolean(),
});

export type ReviewOrderInput = z.output<typeof reviewOrderSchema>;

export const ORDER_MESSAGE_MAX = 500;

export const orderMessageInputSchema = z.object({
  code: orderCodeSchema,
  body: userTextSchema(ORDER_MESSAGE_MAX),
});

export type OrderMessageInput = z.output<typeof orderMessageInputSchema>;

/** The confirmation screens a finished request lands on. */
export const orderOutcomeSchema = z.enum(['cancelled', 'returned', 'reviewed', 'instalment-paid']);

export type OrderOutcome = z.output<typeof orderOutcomeSchema>;
