'use server';

import { addToCartSchema, goldColourSchema } from '@sharghigold/contracts';
import { toLatinDigits } from '@sharghigold/money';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { CODE_PROBLEM, toman } from '@/lib/cart-view';
import { requireViewer } from '@/server/account/session';
import { accountsAvailable } from '@/server/account/store';
import { consume } from '@/server/account/rate-limit';
import {
  addToCart,
  applyCode,
  clearCode,
  dropSaved,
  keepForLater,
  lockExpired,
  priceCart,
  refreshRate,
  removeLine,
  restoreSaved,
  setLineQuantity,
} from '@/server/cart/cart';

import type { CodeState } from './state';

/**
 * Everything the basket screens do.
 *
 * Each action reads the viewer from the session cookie and names a row by id;
 * the row is then resolved inside that viewer's own basket, so an id belonging
 * to somebody else is simply not found. No action accepts a price, a total or
 * a discount amount — the only numbers that cross are a quantity and a
 * product slug, and both are checked against the catalogue and the stock.
 *
 * They redirect rather than returning, so the result is a fresh render with
 * the new totals and a confirmation in the URL. A key travels, never a
 * sentence: a page that prints arbitrary query text is a phishing page on the
 * shop's own domain.
 */

function read(form: FormData, key: string): string {
  const raw = form.get(key);
  return typeof raw === 'string' ? raw.trim() : '';
}

function backToCart(flash?: string): never {
  redirect(flash === undefined ? '/cart' : `/cart?ok=${flash}`);
}

/* -------------------------------------------------------------------------- */
/* Lines                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Put a piece in the basket.
 *
 * Called from the product page. The size and colour are whatever the form
 * carried, and both are checked against the product itself inside
 * `addToCart` — the page's own list of sizes is generated from the same data,
 * so a request naming one it does not offer did not come from the page.
 */
export async function addProductToCart(form: FormData): Promise<void> {
  const viewer = await requireViewer();

  const size = read(form, 'size');
  const wanted = addToCartSchema.safeParse({
    productSlug: read(form, 'slug'),
    size: size === '' ? null : Number(toLatinDigits(size)),
    colour: goldColourSchema.safeParse(read(form, 'colour')).data ?? 'yellow',
    quantity: 1,
  });

  if (!wanted.success) redirect('/cart?problem=not-added');

  const added = await addToCart(viewer, wanted.data);
  if (added.status !== 'added') redirect(`/cart?problem=${added.status}`);

  backToCart('cart-added');
}

export async function changeQuantity(form: FormData): Promise<void> {
  const viewer = await requireViewer();
  const quantity = Number(toLatinDigits(read(form, 'quantity')));

  const changed = setLineQuantity(viewer, read(form, 'line'), quantity);
  if (changed.status === 'out-of-stock') redirect('/cart?problem=out-of-stock');

  backToCart();
}

export async function removeFromCart(form: FormData): Promise<void> {
  const viewer = await requireViewer();
  removeLine(viewer, read(form, 'line'));
  backToCart('cart-removed');
}

export async function keepLineForLater(form: FormData): Promise<void> {
  const viewer = await requireViewer();
  keepForLater(viewer, read(form, 'line'));
  backToCart('cart-kept');
}

export async function restoreLine(form: FormData): Promise<void> {
  const viewer = await requireViewer();

  const restored = restoreSaved(viewer, read(form, 'line'));
  if (restored.status === 'out-of-stock') redirect('/cart/saved?problem=out-of-stock');
  if (restored.status === 'basket-full') redirect('/cart/saved?problem=basket-full');

  redirect('/cart?ok=cart-restored');
}

export async function dropSavedLine(form: FormData): Promise<void> {
  const viewer = await requireViewer();
  dropSaved(viewer, read(form, 'line'));
  redirect('/cart/saved?ok=cart-dropped');
}

/* -------------------------------------------------------------------------- */
/* The price lock                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Take a fresh gold rate for this basket.
 *
 * The only thing that moves a basket's locked rate. It is a deliberate act
 * with a button on it, because a rate that refreshed itself would change the
 * total under somebody who was reading it.
 */
export async function refreshPrices(): Promise<void> {
  const viewer = await requireViewer();
  refreshRate(viewer);
  backToCart('cart-refreshed');
}

/* -------------------------------------------------------------------------- */
/* Discount codes                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Try a code against the basket.
 *
 * Rate limited: guessing at codes is cheap for whoever is doing it and free
 * money if one lands. An unknown code and an expired one are answered
 * identically, because the difference is exactly what a guesser would use.
 */
export async function applyDiscount(_previous: CodeState, form: FormData): Promise<CodeState> {
  const viewer = await requireViewer();
  const typed = read(form, 'code');

  if (!accountsAvailable()) {
    return { status: 'invalid', message: CODE_PROBLEM.unknown, code: typed };
  }

  const budget = consume('cart:code', viewer.customer.id);
  if (!budget.allowed) {
    return {
      status: 'invalid',
      message: 'تعداد تلاش‌ها بیش از حد مجاز بود. کمی بعد دوباره امتحان کنید.',
      code: typed,
    };
  }

  const applied = await applyCode(viewer, typed);

  switch (applied.status) {
    case 'applied':
      // The bill and the pinned total are elsewhere on this page, and a code
      // moves both. Without this the field says «applied» over a total that
      // still shows the undiscounted figure.
      revalidatePath('/cart');
      return { status: 'applied', label: applied.label, code: typed.toUpperCase() };
    case 'below-minimum':
      return {
        status: 'invalid',
        message: `این کد برای سبدهای بالای ${toman(applied.minimumRials)} تومان است.`,
        code: typed,
      };
    case 'empty':
      return { status: 'invalid', message: CODE_PROBLEM.empty, code: typed };
    case 'nothing-to-discount':
      return { status: 'invalid', message: CODE_PROBLEM['nothing-to-discount'], code: typed };
    default:
      return { status: 'invalid', message: CODE_PROBLEM.unknown, code: typed };
  }
}

export async function removeDiscount(): Promise<void> {
  const viewer = await requireViewer();
  clearCode(viewer);
  backToCart('code-cleared');
}

/* -------------------------------------------------------------------------- */
/* On to checkout                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Leave the basket for the delivery screen.
 *
 * The three conditions are checked here rather than left to a disabled button:
 * the basket has something in it, the price lock is still running, and every
 * line can actually be supplied. A customer who gets past the button is
 * stopped by the same rule, with the same sentence.
 */
export async function startCheckout(): Promise<void> {
  const viewer = await requireViewer();
  const { cart, quote } = await priceCart(viewer);

  if (quote.lines.length === 0) redirect('/cart?problem=empty');
  if (lockExpired(cart, new Date())) redirect('/cart?problem=lock-expired');
  if (quote.lines.some((line) => !line.orderable)) redirect('/cart?problem=out-of-stock');

  redirect('/checkout/delivery');
}
