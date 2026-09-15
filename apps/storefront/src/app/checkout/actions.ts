'use server';

import { toLatinDigits } from '@sharghigold/money';
import { redirect } from 'next/navigation';

import { routes } from '@/lib/routes';
import { requireViewer } from '@/server/account/session';
import {
  acceptTerms,
  chooseAddress,
  chooseBranch,
  chooseMonths,
  choosePayment,
  chooseShipping,
  chooseSlot,
  deliveryProblem,
  draftOf,
  setDeliveryMode,
  setGiftWrap,
  setNotes,
  setOtherRecipient,
  setSimulatedOutcome,
  setInvoice,
} from '@/server/checkout/draft';
import { placeOrder } from '@/server/checkout/orders';

/**
 * Everything the three checkout screens do.
 *
 * Each action writes one part of the server-held draft and sends the customer
 * back to the screen that owns it, so the next render is priced from what was
 * actually saved. Nothing carries the whole draft forward through hidden
 * fields: a hidden field naming an address is a field that can name somebody
 * else's, and one naming a payment method is a field that can name a method
 * the shop refused.
 *
 * Every value is resolved inside the viewer's own rows or against the shop's
 * own policy tables before it is stored. An id that matches nothing is
 * ignored, which is the same answer as one belonging to another customer.
 */

function read(form: FormData, key: string): string {
  const raw = form.get(key);
  return typeof raw === 'string' ? raw.trim() : '';
}

function digits(form: FormData, key: string): string {
  return toLatinDigits(read(form, key)).replace(/[^0-9]/g, '');
}

/* -------------------------------------------------------------------------- */
/* Step one — how the order is received                                       */
/* -------------------------------------------------------------------------- */

export async function pickMode(form: FormData): Promise<void> {
  const viewer = await requireViewer();
  setDeliveryMode(viewer, read(form, 'mode'));
  redirect(routes.checkoutDelivery());
}

export async function pickAddress(form: FormData): Promise<void> {
  const viewer = await requireViewer();
  chooseAddress(viewer, read(form, 'address'));
  redirect(routes.checkoutDelivery());
}

export async function pickShipping(form: FormData): Promise<void> {
  const viewer = await requireViewer();
  chooseShipping(viewer, read(form, 'shipping'));
  redirect(routes.checkoutDelivery());
}

export async function pickBranch(form: FormData): Promise<void> {
  const viewer = await requireViewer();
  chooseBranch(viewer, read(form, 'branch'));
  redirect(routes.checkoutDelivery());
}

export async function pickSlot(form: FormData): Promise<void> {
  const viewer = await requireViewer();
  chooseSlot(viewer, read(form, 'slot'));
  redirect(routes.checkoutDelivery());
}

/**
 * Gift wrapping on or off.
 *
 * A submit button rather than a checkbox, because turning it on adds a fee and
 * the total beside it has to change with it. The new state is the button's
 * value, so a stale page cannot toggle something twice.
 */
export async function toggleGift(form: FormData): Promise<void> {
  const viewer = await requireViewer();
  setGiftWrap(viewer, read(form, 'gift') === 'on');
  redirect(routes.checkoutDelivery());
}

/**
 * Save the recipient and the note, then move on to payment.
 *
 * These are the only free-text fields on the screen, so they are saved by the
 * same press that continues — which is also where the design puts its
 * validation. An incomplete recipient stops the step rather than being stored
 * half-written.
 */
export async function continueToPayment(form: FormData): Promise<void> {
  const viewer = await requireViewer();

  const other = read(form, 'other') === 'on';
  const recipient = setOtherRecipient(viewer, {
    on: other,
    name: read(form, 'recipientName'),
    mobile: digits(form, 'recipientMobile'),
  });

  if (recipient.status === 'invalid') redirect(routes.checkoutDelivery({ problem: 'recipient' }));

  setNotes(viewer, read(form, 'notes'));

  const draft = draftOf(viewer);
  const problem = deliveryProblem(viewer, draft, new Date());
  if (problem !== undefined) redirect(routes.checkoutDelivery({ problem }));

  redirect(routes.checkoutPayment());
}

/* -------------------------------------------------------------------------- */
/* Step two — how it is paid for                                              */
/* -------------------------------------------------------------------------- */

export async function pickPayment(form: FormData): Promise<void> {
  const viewer = await requireViewer();
  choosePayment(viewer, read(form, 'payment'));
  redirect(routes.checkoutPayment());
}

export async function pickMonths(form: FormData): Promise<void> {
  const viewer = await requireViewer();
  chooseMonths(viewer, Number(digits(form, 'months')));
  redirect(routes.checkoutPayment());
}

/**
 * Save the invoice details and move on to the review.
 *
 * An official invoice needs a company and an economic code, and the review
 * screen has no field for either — so they are checked here, where they were
 * typed, and the step does not advance without them.
 */
export async function continueToReview(form: FormData): Promise<void> {
  const viewer = await requireViewer();

  const invoice = setInvoice(viewer, {
    type: read(form, 'invoice'),
    name: read(form, 'companyName'),
    code: digits(form, 'companyCode'),
  });

  if (invoice.status === 'invalid') redirect(routes.checkoutPayment({ problem: 'invoice' }));

  redirect(routes.checkoutReview());
}

/**
 * Development only: stage how the simulated provider will answer.
 *
 * Ignored outright where there is a real bank, which is the same guard the
 * store and the top-up flow use. It configures the fake provider; it cannot
 * bypass the shop.
 */
export async function pickSimulated(form: FormData): Promise<void> {
  const viewer = await requireViewer();
  setSimulatedOutcome(viewer, read(form, 'simulate'));
  redirect(routes.checkoutReview());
}

/* -------------------------------------------------------------------------- */
/* Step three — the order                                                     */
/* -------------------------------------------------------------------------- */

export async function setTerms(form: FormData): Promise<void> {
  const viewer = await requireViewer();
  acceptTerms(viewer, read(form, 'terms') === 'on');
  redirect(routes.checkoutReview());
}

/**
 * Place the order.
 *
 * Carries one thing: the token this render of the review screen was issued.
 * Everything else — what is in the basket, what it costs, where it is going
 * and how it is being paid for — is read on the server from the basket and
 * the draft, and re-priced from the catalogue before a rial moves.
 */
export async function payAndPlace(form: FormData): Promise<void> {
  const viewer = await requireViewer();
  const placed = await placeOrder(viewer, read(form, 'intent'));

  switch (placed.status) {
    case 'placed':
    case 'already-placed':
      redirect(routes.checkoutOrder(placed.code));
      break;
    case 'insufficient-funds':
      redirect(routes.checkoutPayment({ problem: 'insufficient-funds' }));
      break;
    case 'out-of-stock':
      redirect(routes.cart({ problem: 'out-of-stock' }));
      break;
    case 'throttled':
      redirect(routes.checkoutReview({ problem: 'throttled' }));
      break;
    default:
      redirect(routes.checkoutReview({ problem: placed.status }));
  }
}
