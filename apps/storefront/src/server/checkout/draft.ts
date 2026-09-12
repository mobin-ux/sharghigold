/**
 * The choices made on the way to paying.
 *
 * Held on the server, one draft per customer, and written a field at a time by
 * the screen that owns it. The alternative — carrying the whole thing forward
 * through hidden inputs — puts «which address», «which branch» and «which
 * payment method» in a form a customer can edit, and every one of those is a
 * decision the shop has to make for itself (rules 15 and 17).
 *
 * Every setter resolves what it is given inside the viewer's own rows. An
 * address id that belongs to somebody else is not found, not refused, so the
 * answer carries no confirmation that the id exists.
 *
 * Nothing here holds money. A draft says «post, not courier»; what post costs
 * is the shop's, from `checkout-policy`, and is applied by `pricing.ts`.
 */
import {
  companyDetailsSchema,
  deliveryModeSchema,
  checkoutPaymentSchema,
  invoiceTypeSchema,
  orderNoteSchema,
  otherRecipientSchema,
  shippingMethodSchema,
  type Address,
  type DeliveryMode,
  type ShippingMethod,
} from '@sharghigold/contracts';
import { toLatinDigits } from '@sharghigold/money';

import { getAddress, getAddresses } from '@/server/account/account';
import { newToken } from '@/server/account/crypto';
import type { Viewer } from '@/server/account/session';
import { getOrCreateDraft, type CheckoutDraftRecord } from '@/server/account/store';
import {
  BRANCHES,
  findBranch,
  findCollectionSlot,
  SHIPPING_CHOICES,
  type Branch,
  type CollectionSlot,
} from '@/server/policy/checkout-policy';
import { INSTALLMENT } from '@/server/policy/shop-policy';
import { paymentsAvailable } from '@/server/wallet/psp';

/* -------------------------------------------------------------------------- */
/* Reading                                                                    */
/* -------------------------------------------------------------------------- */

export function draftOf(viewer: Viewer, now: Date = new Date()): CheckoutDraftRecord {
  return getOrCreateDraft(viewer.customer.id, now);
}

/**
 * The address the order will go to.
 *
 * Falls back to the default rather than to nothing when the draft names one
 * that has since been deleted: a checkout that silently loses its address is
 * a checkout that ships to the last address anybody looked at.
 */
export function chosenAddress(viewer: Viewer, draft: CheckoutDraftRecord): Address | undefined {
  const named = draft.addressId === null ? undefined : getAddress(viewer, draft.addressId);
  if (named !== undefined) return named;

  const all = getAddresses(viewer);
  return all.find((address) => address.isDefault) ?? all[0];
}

export function chosenBranch(draft: CheckoutDraftRecord): Branch {
  return findBranch(draft.branchId) ?? (BRANCHES[0] as Branch);
}

/**
 * The collection window, if the one on the draft is still on offer.
 *
 * A window that has passed is simply not found, and the screen asks again.
 * Keeping it would take a booking for a time nobody will be there.
 */
export function chosenSlot(draft: CheckoutDraftRecord, now: Date): CollectionSlot | undefined {
  if (draft.slotId === null) return undefined;
  return findCollectionSlot(chosenBranch(draft), draft.slotId, now);
}

export function chosenShipping(draft: CheckoutDraftRecord): ShippingMethod {
  return SHIPPING_CHOICES.some((choice) => choice.method === draft.shipping)
    ? draft.shipping
    : 'post';
}

export function chosenMonths(draft: CheckoutDraftRecord): number {
  const terms: readonly number[] = INSTALLMENT.terms;
  return terms.includes(draft.installmentMonths) ? draft.installmentMonths : (terms[0] ?? 12);
}

/* -------------------------------------------------------------------------- */
/* Writing                                                                    */
/* -------------------------------------------------------------------------- */

function touch(draft: CheckoutDraftRecord, now: Date): void {
  draft.updatedAt = now.toISOString();
  // Any change invalidates an outstanding submission token: the order about to
  // be placed is no longer the order that was reviewed.
  draft.intent = null;
}

export function setDeliveryMode(viewer: Viewer, raw: string, now = new Date()): DeliveryMode {
  const draft = draftOf(viewer, now);
  const mode = deliveryModeSchema.safeParse(raw);
  if (mode.success) {
    draft.mode = mode.data;
    touch(draft, now);
  }
  return draft.mode;
}

/** Choose an address, only if it is one of this customer's own. */
export function chooseAddress(viewer: Viewer, id: string, now = new Date()): boolean {
  if (getAddress(viewer, id) === undefined) return false;

  const draft = draftOf(viewer, now);
  draft.addressId = id;
  touch(draft, now);
  return true;
}

export function chooseShipping(viewer: Viewer, raw: string, now = new Date()): boolean {
  const method = shippingMethodSchema.safeParse(raw);
  if (!method.success) return false;

  const draft = draftOf(viewer, now);
  draft.shipping = method.data;
  touch(draft, now);
  return true;
}

export function chooseBranch(viewer: Viewer, id: string, now = new Date()): boolean {
  if (findBranch(id) === undefined) return false;

  const draft = draftOf(viewer, now);
  if (draft.branchId !== id) draft.slotId = null;
  draft.branchId = id;
  touch(draft, now);
  return true;
}

/** Book a collection window, only if it is one the branch is still offering. */
export function chooseSlot(viewer: Viewer, id: string, now = new Date()): boolean {
  const draft = draftOf(viewer, now);
  if (findCollectionSlot(chosenBranch(draft), id, now) === undefined) return false;

  draft.slotId = id;
  touch(draft, now);
  return true;
}

export function setGiftWrap(viewer: Viewer, on: boolean, now = new Date()): void {
  const draft = draftOf(viewer, now);
  draft.gift = on;
  touch(draft, now);
}

export type RecipientResult =
  | { readonly status: 'saved' }
  | { readonly status: 'cleared' }
  | { readonly status: 'invalid'; readonly message: string };

/**
 * Name somebody else as the recipient, or go back to the account holder.
 *
 * Turning the switch off clears both fields rather than leaving them where
 * they were. A name left behind is a name that goes on the parcel the next
 * time somebody forgets to check.
 */
export function setOtherRecipient(
  viewer: Viewer,
  input: { readonly on: boolean; readonly name: string; readonly mobile: string },
  now = new Date(),
): RecipientResult {
  const draft = draftOf(viewer, now);

  if (!input.on) {
    draft.recipientName = null;
    draft.recipientMobile = null;
    touch(draft, now);
    return { status: 'cleared' };
  }

  const parsed = otherRecipientSchema.safeParse({
    name: input.name,
    mobile: toLatinDigits(input.mobile).replace(/[\s-]/g, ''),
  });

  if (!parsed.success) {
    return {
      status: 'invalid',
      message: parsed.error.issues[0]?.message ?? 'اطلاعات گیرنده کامل نیست',
    };
  }

  draft.recipientName = parsed.data.name;
  draft.recipientMobile = parsed.data.mobile;
  touch(draft, now);
  return { status: 'saved' };
}

export function setNotes(viewer: Viewer, raw: string, now = new Date()): void {
  const draft = draftOf(viewer, now);
  const notes = orderNoteSchema.safeParse(raw);
  draft.notes = notes.success ? notes.data : '';
  touch(draft, now);
}

export function choosePayment(viewer: Viewer, raw: string, now = new Date()): boolean {
  const payment = checkoutPaymentSchema.safeParse(raw);
  if (!payment.success) return false;

  const draft = draftOf(viewer, now);
  draft.payment = payment.data;
  touch(draft, now);
  return true;
}

export function chooseMonths(viewer: Viewer, months: number, now = new Date()): boolean {
  const terms: readonly number[] = INSTALLMENT.terms;
  if (!terms.includes(months)) return false;

  const draft = draftOf(viewer, now);
  draft.installmentMonths = months;
  touch(draft, now);
  return true;
}

export type InvoiceResult =
  { readonly status: 'saved' } | { readonly status: 'invalid'; readonly message: string };

export function setInvoice(
  viewer: Viewer,
  input: { readonly type: string; readonly name: string; readonly code: string },
  now = new Date(),
): InvoiceResult {
  const type = invoiceTypeSchema.safeParse(input.type);
  if (!type.success) return { status: 'invalid', message: 'نوع فاکتور معتبر نیست' };

  const draft = draftOf(viewer, now);

  if (type.data === 'personal') {
    draft.invoice = 'personal';
    draft.companyName = null;
    draft.companyCode = null;
    touch(draft, now);
    return { status: 'saved' };
  }

  const company = companyDetailsSchema.safeParse({
    name: input.name,
    economicCode: toLatinDigits(input.code).replace(/[\s-]/g, ''),
  });

  if (!company.success) {
    return {
      status: 'invalid',
      message: company.error.issues[0]?.message ?? 'اطلاعات فاکتور رسمی کامل نیست',
    };
  }

  draft.invoice = 'official';
  draft.companyName = company.data.name;
  draft.companyCode = company.data.economicCode;
  touch(draft, now);
  return { status: 'saved' };
}

export function acceptTerms(viewer: Viewer, accepted: boolean, now = new Date()): void {
  const draft = draftOf(viewer, now);
  const already = draft.termsAcceptedAt !== null;
  draft.termsAcceptedAt = accepted ? now.toISOString() : null;

  // Accepting is not a change to what is being bought, so it must not
  // invalidate the token the same screen is about to submit.
  if (already !== accepted) draft.updatedAt = now.toISOString();
}

/* -------------------------------------------------------------------------- */
/* Completeness                                                               */
/* -------------------------------------------------------------------------- */

export type DeliveryProblem =
  'no-address' | 'no-slot' | 'recipient-incomplete' | 'courier-outside-tehran';

/**
 * What still has to be decided before delivery is settled.
 *
 * Returned as keys rather than sentences: the screen writes the Persian, and a
 * server that sent copy would be choosing what a customer's page says.
 */
export function deliveryProblem(
  viewer: Viewer,
  draft: CheckoutDraftRecord,
  now: Date,
): DeliveryProblem | undefined {
  if (draft.mode === 'pickup') {
    return chosenSlot(draft, now) === undefined ? 'no-slot' : undefined;
  }

  const address = chosenAddress(viewer, draft);
  if (address === undefined) return 'no-address';

  if (chosenShipping(draft) === 'courier' && address.province !== 'تهران') {
    return 'courier-outside-tehran';
  }

  if (draft.recipientName !== null && draft.recipientMobile === null) {
    return 'recipient-incomplete';
  }

  return undefined;
}

export type PaymentProblem = 'invoice-incomplete' | 'method-unavailable';

export function paymentProblem(draft: CheckoutDraftRecord): PaymentProblem | undefined {
  if (draft.invoice === 'official' && (draft.companyName === null || draft.companyCode === null)) {
    return 'invoice-incomplete';
  }
  return undefined;
}

/* -------------------------------------------------------------------------- */
/* The submission token                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Mint the token the review screen submits with.
 *
 * A fresh one on every render: only the most recently reviewed order can be
 * placed, and a form left open in a second tab while the basket changed
 * submits a token that is no longer the draft's.
 */
export function issueIntent(viewer: Viewer, now = new Date()): string {
  const draft = draftOf(viewer, now);
  const intent = newToken();
  draft.intent = intent;
  return intent;
}

/**
 * Development only: stage how the simulated provider will answer.
 *
 * Written onto the draft rather than posted with the order, and read by
 * `placeOrder` only where `paymentsAvailable()` is true. Ignored outright
 * otherwise, so the control configures the fake bank and never bypasses the
 * shop.
 */
export function setSimulatedOutcome(viewer: Viewer, raw: string, now = new Date()): void {
  if (!paymentsAvailable()) return;

  const draft = draftOf(viewer, now);
  draft.simulate = raw === '' ? null : raw;
  draft.updatedAt = now.toISOString();
}

export type { CheckoutDraftRecord };
