'use server';

import {
  cancelOrderSchema,
  orderCodeSchema,
  orderMessageInputSchema,
  returnOrderSchema,
  reviewOrderSchema,
} from '@sharghigold/contracts';
import { redirect } from 'next/navigation';

import { retryLabel } from '@/lib/product-view';
import { routes } from '@/lib/routes';
import { requireViewer } from '@/server/account/session';
import {
  cancelOrder,
  payNextInstalment,
  postOrderMessage,
  reorder,
  requestReturn,
  reviewOrder,
  withdrawReturn,
} from '@/server/orders/lifecycle';

import type { OrderFormState } from './state';

/**
 * Everything a customer can ask of one of their own orders.
 *
 * Each action resolves the customer itself with `requireViewer()` — never from
 * a form field — and parses the form through the shared contract. The order
 * code in the form is only a key: the lifecycle looks it up among this
 * customer's rows and re-checks what the order allows at the moment of
 * writing. No amount is read from the form anywhere in this file.
 *
 * Success redirects, so a refresh does not repeat the request and the
 * confirmation is an address that reads its facts from the order.
 */

const text = (form: FormData, name: string): string | undefined => {
  const value = form.get(name);
  return typeof value === 'string' ? value : undefined;
};

const fail = (message: string): OrderFormState => ({ status: 'error', message });

type Refusal =
  | { readonly status: 'not-found' }
  | { readonly status: 'not-allowed' }
  | { readonly status: 'throttled'; readonly retryAfterSeconds: number };

function refused(result: Refusal, notAllowed: string): OrderFormState {
  if (result.status === 'throttled') {
    return fail(
      `درخواست‌های زیادی ثبت شد. ${retryLabel(result.retryAfterSeconds)} دیگر دوباره تلاش کنید.`,
    );
  }
  if (result.status === 'not-found') return fail('این سفارش پیدا نشد.');
  return fail(notAllowed);
}

export async function submitCancellation(
  _previous: OrderFormState,
  form: FormData,
): Promise<OrderFormState> {
  const viewer = await requireViewer();
  const parsed = cancelOrderSchema.safeParse({
    code: text(form, 'code'),
    reason: text(form, 'reason'),
    note: text(form, 'note'),
  });
  if (!parsed.success) return fail('دلیل لغو را انتخاب کنید.');

  const result = cancelOrder(viewer, parsed.data);
  if (result.status !== 'cancelled') {
    return refused(result, 'این سفارش دیگر قابل لغو نیست؛ برای مرجوعی با پشتیبانی گفت‌وگو کنید.');
  }

  redirect(routes.accountOrderDone(parsed.data.code, 'cancelled'));
}

export async function submitReturn(
  _previous: OrderFormState,
  form: FormData,
): Promise<OrderFormState> {
  const viewer = await requireViewer();
  const parsed = returnOrderSchema.safeParse({
    code: text(form, 'code'),
    lines: form.getAll('lines').filter((value) => typeof value === 'string'),
    reason: text(form, 'reason'),
    refundTo: text(form, 'refundTo'),
    note: text(form, 'note'),
  });
  if (!parsed.success) return fail('کالا و دلیل مرجوع کردن را مشخص کنید.');

  const result = requestReturn(viewer, parsed.data);
  if (result.status !== 'requested') {
    return refused(result, 'مهلت یا شرایط مرجوعی این سفارش برقرار نیست.');
  }

  redirect(routes.accountOrderDone(parsed.data.code, 'returned'));
}

export async function submitReturnWithdrawal(
  _previous: OrderFormState,
  form: FormData,
): Promise<OrderFormState> {
  const viewer = await requireViewer();
  const code = orderCodeSchema.safeParse(text(form, 'code'));
  if (!code.success) return fail('این سفارش پیدا نشد.');

  const result = withdrawReturn(viewer, code.data);
  if (result.status !== 'withdrawn') {
    return refused(result, 'کالا دریافت شده است و این درخواست دیگر قابل لغو نیست.');
  }

  redirect(routes.accountOrder(code.data));
}

/** Ratings arrive as `rating.0`, `rating.1`… so a piece left unrated is a gap, not a shift. */
function ratingsFrom(form: FormData, count: number): readonly (string | undefined)[] {
  return Array.from({ length: Math.min(count, 50) }, (_, index) => text(form, `rating.${index}`));
}

export async function submitOrderReview(
  _previous: OrderFormState,
  form: FormData,
): Promise<OrderFormState> {
  const viewer = await requireViewer();
  const count = Number(text(form, 'pieces'));
  const ratings = ratingsFrom(form, Number.isSafeInteger(count) && count > 0 ? count : 1);

  if (ratings.some((rating) => rating === undefined)) return fail('امتیاز هر کالا را انتخاب کنید.');

  const parsed = reviewOrderSchema.safeParse({
    code: text(form, 'code'),
    ratings,
    body: text(form, 'body'),
    tags: form.getAll('tags').filter((value) => typeof value === 'string'),
    anonymous: form.get('anonymous') === 'on',
  });
  if (!parsed.success) return fail('امتیاز هر کالا را انتخاب کنید.');

  const result = reviewOrder(viewer, parsed.data);
  if (result.status !== 'submitted') {
    return refused(result, 'برای این سفارش نظری ثبت شده است یا هنوز تحویل نشده است.');
  }

  redirect(routes.accountOrderDone(parsed.data.code, 'reviewed'));
}

export async function submitOrderMessage(
  _previous: OrderFormState,
  form: FormData,
): Promise<OrderFormState> {
  const viewer = await requireViewer();
  const parsed = orderMessageInputSchema.safeParse({
    code: text(form, 'code'),
    body: text(form, 'body'),
  });
  if (!parsed.success) return fail('پیام خالی است یا بیش از حد طولانی است.');

  const result = postOrderMessage(viewer, parsed.data);
  if (result.status !== 'sent') return refused(result, 'این گفت‌وگو به سقف پیام‌ها رسیده است.');

  redirect(routes.accountOrderSupport(parsed.data.code));
}

export async function submitInstalmentPayment(
  _previous: OrderFormState,
  form: FormData,
): Promise<OrderFormState> {
  const viewer = await requireViewer();
  const code = orderCodeSchema.safeParse(text(form, 'code'));
  if (!code.success) return fail('این سفارش پیدا نشد.');

  const result = payNextInstalment(viewer, code.data);
  if (result.status === 'insufficient-funds') {
    return fail('موجودی کیف پول برای این قسط کافی نیست. ابتدا کیف پول را شارژ کنید.');
  }
  if (result.status !== 'paid') return refused(result, 'قسط پرداخت‌نشده‌ای برای این سفارش نیست.');

  redirect(routes.accountOrderDone(code.data, 'instalment-paid'));
}

export async function submitReorder(
  _previous: OrderFormState,
  form: FormData,
): Promise<OrderFormState> {
  const viewer = await requireViewer();
  const code = orderCodeSchema.safeParse(text(form, 'code'));
  if (!code.success) return fail('این سفارش پیدا نشد.');

  const result = await reorder(viewer, code.data);
  if (result.status !== 'added') return refused(result, 'این سفارش را نمی‌توان دوباره خرید.');
  if (result.added === 0) return fail('کالاهای این سفارش در حال حاضر موجود نیستند.');

  redirect(routes.cart());
}
