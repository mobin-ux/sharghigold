'use server';

import { paymentMethodSchema, topUpTomanSchema } from '@sharghigold/contracts';
import { toLatinDigits } from '@sharghigold/money';
import { redirect } from 'next/navigation';

import { retryLabel } from '@/lib/product-view';
import { AMOUNT_PROBLEM } from '@/lib/wallet-view';
import { requireViewer } from '@/server/account/session';
import { accountsAvailable } from '@/server/account/store';
import { paymentsAvailable } from '@/server/wallet/psp';
import { cancelTopUp, settleTopUp, startTopUp } from '@/server/wallet/top-up';

import type { TopUpDraft, TopUpState } from './state';

function read(form: FormData, key: string): string {
  const raw = form.get(key);
  return typeof raw === 'string' ? raw.trim() : '';
}

/** Read the whole form back, so a refusal returns what was typed. */
function readDraft(form: FormData): TopUpDraft {
  const method = paymentMethodSchema.safeParse(read(form, 'method'));

  return {
    toman: toLatinDigits(read(form, 'toman')).replace(/[^0-9]/g, ''),
    method: method.success ? method.data : 'gateway',
  };
}

/**
 * Which ending the development provider should stage.
 *
 * Read from the form only where there is no bank — the same guard the store
 * uses. In production this returns nothing and the provider refuses to
 * authorise at all, so the field cannot influence a real payment even if
 * somebody posts it.
 */
function simulated(form: FormData): string | undefined {
  if (!paymentsAvailable()) return undefined;
  const raw = read(form, 'simulate');
  return raw === '' ? undefined : raw;
}

/**
 * Start a payment.
 *
 * The amount is checked here and converted to rials by the server, and the
 * payment is created before the customer leaves for the bank. Nothing after
 * this point reads an amount from a request: the figure that will be charged
 * and the figure that will be credited are the same stored number.
 */
export async function startPayment(_previous: TopUpState, form: FormData): Promise<TopUpState> {
  const viewer = await requireViewer();
  const draft = readDraft(form);

  if (!accountsAvailable() || !paymentsAvailable()) {
    return { status: 'unavailable', draft };
  }

  if (draft.toman === '') {
    return { status: 'invalid', message: AMOUNT_PROBLEM.empty, draft };
  }

  const toman = topUpTomanSchema.safeParse(draft.toman);
  if (!toman.success) {
    return { status: 'invalid', message: AMOUNT_PROBLEM.shape, draft };
  }

  const started = startTopUp(viewer, {
    toman: toman.data,
    method: draft.method,
    simulate: simulated(form),
  });

  switch (started.status) {
    case 'too-small':
      return { status: 'invalid', message: AMOUNT_PROBLEM['too-small'], draft };
    case 'too-large':
      return { status: 'invalid', message: AMOUNT_PROBLEM['too-large'], draft };
    case 'method-unavailable':
      return { status: 'invalid', message: AMOUNT_PROBLEM['method-unavailable'], draft };
    case 'throttled':
      return {
        status: 'invalid',
        message: `درخواست پرداخت بیش از حد مجاز بود. ${retryLabel(started.retryAfterSeconds)} دیگر دوباره تلاش کنید.`,
        draft,
      };
    default:
      break;
  }

  redirect(`/wallet/top-up/${started.id}`);
}

/**
 * Come back from the bank.
 *
 * What happened is asked of the provider inside `settleTopUp`; this action
 * carries nothing but the payment's own id. Calling it twice is safe, which
 * matters because the page it runs from is a page people refresh.
 */
export async function returnFromGateway(form: FormData): Promise<void> {
  const viewer = await requireViewer();
  const id = read(form, 'id');

  const receipt = settleTopUp(viewer, id);
  if (receipt === undefined) redirect('/wallet/top-up');

  redirect(`/wallet/top-up/${id}/result`);
}

/** The customer pressed «cancel» at the bank. */
export async function cancelPayment(form: FormData): Promise<void> {
  const viewer = await requireViewer();
  const id = read(form, 'id');

  const receipt = cancelTopUp(viewer, id);
  if (receipt === undefined) redirect('/wallet/top-up');

  redirect(`/wallet/top-up/${id}/result`);
}

/**
 * Ask the bank again about a payment it has not finished with.
 *
 * The same settlement path as the return from the gateway, because «ask again»
 * and «ask the first time» are the same question and must not have two
 * answers.
 */
export async function recheckPayment(form: FormData): Promise<void> {
  const viewer = await requireViewer();
  const id = read(form, 'id');

  settleTopUp(viewer, id);
  redirect(`/wallet/top-up/${id}/result`);
}
