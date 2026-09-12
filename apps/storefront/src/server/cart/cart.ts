/**
 * The basket, as the screens above it see one.
 *
 * Every function here takes a `Viewer` and works inside that viewer's own
 * basket. There is no basket id to pass, so there is none to tamper with:
 * a line id that belongs to somebody else simply is not found, which is the
 * same answer as one that never existed (rule 8).
 *
 * Two things this module refuses to do:
 *
 *   - It never accepts a price, a total or a discount amount. A caller may say
 *     which product, which size and how many; what that costs is derived by
 *     `pricing.ts` from the catalogue and the basket's locked rate.
 *   - It never trusts the page's controls. The stepper caps quantity at what
 *     is in stock and the size list greys out what is unavailable, and both
 *     are checked again here — a disabled control is not a validation.
 *
 * The price lock lives on the basket rather than being struck per render. A
 * rate re-taken on every page load never expires, and a lock that never
 * expires is decoration.
 */
import {
  addToCartSchema,
  CART_MAX_LINES,
  CART_MAX_QUANTITY,
  cartViewSchema,
  discountCodeSchema,
  type AddToCartInput,
  type CartLine,
  type CartView,
  type ProductDetail,
  type SavedLine,
} from '@sharghigold/contracts';
import { toLatinDigits, type Rials } from '@sharghigold/money';

import { getGoldRate } from '@/lib/gold-price';
import { ContractError } from '@/server/account/account';
import type { Viewer } from '@/server/account/session';
import {
  findCart,
  getOrCreateCart,
  newCartLineId,
  touchCart,
  type CartLineRecord,
  type CartRecord,
} from '@/server/account/store';
import { findDiscount, type Discount } from '@/server/cart/discounts';
import {
  deliveryLine,
  cartTotals,
  quoteBasket,
  NO_CHOICES,
  type BasketChoices,
  type BasketQuote,
} from '@/server/cart/pricing';
import { getProducts } from '@/server/catalogue/product';
import { available } from '@/server/inventory/stock';
import { PRICE_LOCK_SECONDS } from '@/server/policy/shop-policy';

function parsed<T>(result: { success: true; data: T } | { success: false }, what: string): T {
  if (!result.success) throw new ContractError(`${what} does not satisfy its contract`);
  return result.data;
}

/* -------------------------------------------------------------------------- */
/* The price lock                                                             */
/* -------------------------------------------------------------------------- */

/** Seconds left on this basket's locked rate. Zero once it has run out. */
export function lockRemaining(cart: CartRecord, now: Date): number {
  const elapsed = Math.floor((now.getTime() - Date.parse(cart.rateQuotedAt)) / 1_000);
  return Math.max(0, PRICE_LOCK_SECONDS - elapsed);
}

export function lockExpired(cart: CartRecord, now: Date): boolean {
  return lockRemaining(cart, now) === 0;
}

/**
 * Take a fresh rate.
 *
 * The only way a basket's rate ever moves. It is an explicit act — the design
 * puts a button on it — because a rate that refreshed itself would change the
 * total under a customer who was reading it.
 */
export function refreshRate(viewer: Viewer, now: Date = new Date()): void {
  const cart = getOrCreateCart(viewer.customer.id, getGoldRate().pricePerGram18k, now);
  cart.ratePerGramRials = getGoldRate().pricePerGram18k;
  cart.rateQuotedAt = now.toISOString();
  touchCart(cart, now);
}

/* -------------------------------------------------------------------------- */
/* Reading                                                                    */
/* -------------------------------------------------------------------------- */

function cartOf(viewer: Viewer, now: Date): CartRecord {
  return getOrCreateCart(viewer.customer.id, getGoldRate().pricePerGram18k, now);
}

/** The code on this basket, if it is still live. */
export function activeDiscount(cart: CartRecord, now: Date): Discount | undefined {
  return cart.discountCode === null ? undefined : findDiscount(cart.discountCode, now);
}

function colourLabel(product: ProductDetail, colour: string): string {
  return product.colours.find((entry) => entry.colour === colour)?.label ?? 'طلای زرد';
}

function toCartLine(priced: BasketQuote['lines'][number]): CartLine {
  const { record, product } = priced;

  return {
    id: record.id,
    productSlug: product.slug,
    title: product.title,
    sku: product.sku,
    mediaId: product.media[0]?.id ?? 'front',
    size: record.size,
    colour: record.colour,
    colourLabel: colourLabel(product, record.colour),
    quantity: record.quantity,
    weightMilligrams: priced.weight.toString(),
    unitTotalRials: priced.unitTotal.toString(),
    lineTotalRials: priced.breakdown.total.toString(),
    stockRemaining: priced.stockRemaining,
    orderable: priced.orderable,
  };
}

function toSavedLine(record: CartLineRecord, product: ProductDetail, unit: Rials): SavedLine {
  return {
    id: record.id,
    productSlug: product.slug,
    title: product.title,
    mediaId: product.media[0]?.id ?? 'front',
    size: record.size,
    colour: record.colour,
    colourLabel: colourLabel(product, record.colour),
    unitTotalRials: unit.toString(),
    orderable: product.inStock && available(product.slug) > 0,
  };
}

/**
 * Price the basket, and everything a caller needs alongside it.
 *
 * Returned as the internal quote rather than the contract shape, because
 * checkout needs the `Rials` values and a screen needs the strings. `viewCart`
 * turns one into the other; nothing formats a total twice.
 */
export async function priceCart(
  viewer: Viewer,
  choices: Partial<BasketChoices> = {},
  now: Date = new Date(),
): Promise<{ cart: CartRecord; quote: BasketQuote; products: ReadonlyMap<string, ProductDetail> }> {
  const cart = cartOf(viewer, now);
  const slugs = [...cart.lines, ...cart.saved].map((line) => line.productSlug);
  const products = await getProducts(slugs);

  const quote = quoteBasket(cart.lines, products, cart.ratePerGramRials as Rials, {
    ...NO_CHOICES,
    discount: activeDiscount(cart, now),
    ...choices,
  });

  return { cart, quote, products };
}

/** The basket as the cart screen draws it. */
export async function viewCart(viewer: Viewer, now: Date = new Date()): Promise<CartView> {
  const { cart, quote, products } = await priceCart(viewer, {}, now);

  const saved: SavedLine[] = [];
  for (const record of cart.saved) {
    const product = products.get(record.productSlug);
    if (product === undefined) continue;

    const unit = quoteBasket(
      [{ ...record, quantity: 1 }],
      products,
      cart.ratePerGramRials as Rials,
      {
        ...NO_CHOICES,
      },
    ).total;

    saved.push(toSavedLine(record, product, unit));
  }

  return parsed(
    cartViewSchema.safeParse({
      lines: quote.lines.map(toCartLine),
      saved,
      itemCount: cart.lines.reduce((count, line) => count + line.quantity, 0),
      discount: quote.discount,
      totals: cartTotals(quote, quote.total, deliveryLine(quote, 'ship')),
      pricePerGramRials: cart.ratePerGramRials.toString(),
      quotedAt: cart.rateQuotedAt,
      expiresAt: new Date(Date.parse(cart.rateQuotedAt) + PRICE_LOCK_SECONDS * 1_000).toISOString(),
      secondsRemaining: lockRemaining(cart, now),
    }),
    'cart',
  );
}

/** How many pieces are in the basket. For the bubble on the basket icon. */
export function cartItemCount(viewer: Viewer): number {
  const cart = findCart(viewer.customer.id);
  return cart === undefined ? 0 : cart.lines.reduce((count, line) => count + line.quantity, 0);
}

/* -------------------------------------------------------------------------- */
/* Writing                                                                    */
/* -------------------------------------------------------------------------- */

export type AddResult =
  | { readonly status: 'added' }
  | { readonly status: 'unknown-product' }
  | { readonly status: 'unavailable-size' }
  | { readonly status: 'out-of-stock'; readonly remaining: number }
  | { readonly status: 'basket-full' };

/**
 * Put a piece in the basket.
 *
 * The size and the colour are checked against the product itself, not against
 * what the page offered: the page's list is generated from the same data, so a
 * request naming a size the product does not have came from somewhere else.
 *
 * A line that matches one already there gains quantity rather than becoming a
 * second row — which is what a customer means by adding the same ring twice,
 * and what stops a basket being filled with twenty rows of one piece.
 */
export async function addToCart(
  viewer: Viewer,
  input: AddToCartInput,
  now: Date = new Date(),
): Promise<AddResult> {
  const wanted = parsed(addToCartSchema.safeParse(input), 'basket line');
  const products = await getProducts([wanted.productSlug]);
  const product = products.get(wanted.productSlug);

  if (product === undefined || !product.inStock) return { status: 'unknown-product' };

  if (wanted.size !== null) {
    const size = product.sizes.find((entry) => entry.value === wanted.size);
    if (size === undefined || !size.available) return { status: 'unavailable-size' };
  }

  const colour = product.colours.find((entry) => entry.colour === wanted.colour);
  if (colour === undefined || !colour.available) return { status: 'unknown-product' };

  const cart = cartOf(viewer, now);
  const existing = cart.lines.find(
    (line) =>
      line.productSlug === wanted.productSlug &&
      line.size === wanted.size &&
      line.colour === wanted.colour,
  );

  if (existing === undefined && cart.lines.length >= CART_MAX_LINES) {
    return { status: 'basket-full' };
  }

  const target = Math.min((existing?.quantity ?? 0) + wanted.quantity, CART_MAX_QUANTITY);
  const remaining = available(wanted.productSlug);
  if (remaining < target) return { status: 'out-of-stock', remaining };

  if (existing === undefined) {
    cart.lines.push({
      id: newCartLineId(),
      productSlug: wanted.productSlug,
      size: wanted.size,
      colour: wanted.colour,
      quantity: target,
      addedAt: now.toISOString(),
    });
  } else {
    existing.quantity = target;
  }

  touchCart(cart, now);
  return { status: 'added' };
}

export type QuantityResult =
  | { readonly status: 'changed'; readonly quantity: number }
  | { readonly status: 'no-such-line' }
  | { readonly status: 'out-of-stock'; readonly remaining: number };

/**
 * Change how many of a line is wanted.
 *
 * Clamped to what is in stock rather than refused outright when the request
 * overshoots: a customer who asks for five of a piece with three left wants
 * three, and the screen says so. Zero is not a quantity — removing is its own
 * act, with its own confirmation.
 */
export function setLineQuantity(
  viewer: Viewer,
  lineId: string,
  quantity: number,
  now: Date = new Date(),
): QuantityResult {
  const cart = cartOf(viewer, now);
  const line = cart.lines.find((entry) => entry.id === lineId);
  if (line === undefined) return { status: 'no-such-line' };

  if (!Number.isSafeInteger(quantity) || quantity < 1) return { status: 'no-such-line' };

  const remaining = available(line.productSlug);
  if (remaining === 0) return { status: 'out-of-stock', remaining };

  const capped = Math.min(quantity, CART_MAX_QUANTITY, remaining);
  line.quantity = capped;
  touchCart(cart, now);

  return capped < quantity
    ? { status: 'out-of-stock', remaining }
    : { status: 'changed', quantity: capped };
}

export function removeLine(viewer: Viewer, lineId: string, now: Date = new Date()): boolean {
  const cart = cartOf(viewer, now);
  const before = cart.lines.length;
  cart.lines = cart.lines.filter((line) => line.id !== lineId);
  if (cart.lines.length === before) return false;

  touchCart(cart, now);
  return true;
}

/** Move a line out of the basket and into «ذخیره‌شده برای بعد». */
export function keepForLater(viewer: Viewer, lineId: string, now: Date = new Date()): boolean {
  const cart = cartOf(viewer, now);
  const line = cart.lines.find((entry) => entry.id === lineId);
  if (line === undefined) return false;

  cart.lines = cart.lines.filter((entry) => entry.id !== lineId);

  // Saving the same piece twice is one saved piece, not two rows.
  const already = cart.saved.some(
    (entry) =>
      entry.productSlug === line.productSlug &&
      entry.size === line.size &&
      entry.colour === line.colour,
  );
  if (!already) cart.saved.push({ ...line, quantity: 1 });

  touchCart(cart, now);
  return true;
}

export type RestoreResult =
  | { readonly status: 'restored' }
  | { readonly status: 'no-such-line' }
  | { readonly status: 'out-of-stock' }
  | { readonly status: 'basket-full' };

/** Put a saved piece back in the basket, if there is still one to be had. */
export function restoreSaved(
  viewer: Viewer,
  savedId: string,
  now: Date = new Date(),
): RestoreResult {
  const cart = cartOf(viewer, now);
  const line = cart.saved.find((entry) => entry.id === savedId);
  if (line === undefined) return { status: 'no-such-line' };

  const existing = cart.lines.find(
    (entry) =>
      entry.productSlug === line.productSlug &&
      entry.size === line.size &&
      entry.colour === line.colour,
  );

  if (existing === undefined && cart.lines.length >= CART_MAX_LINES) {
    return { status: 'basket-full' };
  }

  const target = Math.min((existing?.quantity ?? 0) + 1, CART_MAX_QUANTITY);
  if (available(line.productSlug) < target) return { status: 'out-of-stock' };

  cart.saved = cart.saved.filter((entry) => entry.id !== savedId);
  if (existing === undefined) {
    cart.lines.push({ ...line, id: newCartLineId(), quantity: target, addedAt: now.toISOString() });
  } else {
    existing.quantity = target;
  }

  touchCart(cart, now);
  return { status: 'restored' };
}

export function dropSaved(viewer: Viewer, savedId: string, now: Date = new Date()): boolean {
  const cart = cartOf(viewer, now);
  const before = cart.saved.length;
  cart.saved = cart.saved.filter((entry) => entry.id !== savedId);
  if (cart.saved.length === before) return false;

  touchCart(cart, now);
  return true;
}

/* -------------------------------------------------------------------------- */
/* Discount codes                                                             */
/* -------------------------------------------------------------------------- */

export type CodeResult =
  | { readonly status: 'applied'; readonly label: string }
  | { readonly status: 'empty' }
  | { readonly status: 'malformed' }
  | { readonly status: 'unknown' }
  | { readonly status: 'below-minimum'; readonly minimumRials: string }
  | { readonly status: 'nothing-to-discount' };

/**
 * Apply a code to the basket.
 *
 * The code is stored, never the amount it is worth: an amount written down
 * here is an amount that survives the basket changing underneath it. What it
 * saves is recomputed by `pricing.ts` every time the basket is priced, so
 * emptying the basket empties the discount with it.
 *
 * An unknown code and an expired one give the same answer, because the
 * difference is information a stranger guessing at codes would use.
 */
export async function applyCode(
  viewer: Viewer,
  raw: string,
  now: Date = new Date(),
): Promise<CodeResult> {
  const typed = toLatinDigits(raw).trim();
  if (typed === '') return { status: 'empty' };

  const code = discountCodeSchema.safeParse(typed);
  if (!code.success) return { status: 'malformed' };

  const discount = findDiscount(code.data, now);
  if (discount === undefined) return { status: 'unknown' };

  const { cart, quote } = await priceCart(viewer, { discount: undefined }, now);
  if (quote.lines.length === 0) return { status: 'nothing-to-discount' };

  // The minimum is checked against what the pieces cost, so adding delivery or
  // wrapping cannot be what qualifies a basket for a discount.
  const goods = quote.total;
  if (goods < discount.minimumRials) {
    return { status: 'below-minimum', minimumRials: discount.minimumRials.toString() };
  }

  cart.discountCode = discount.code;
  touchCart(cart, now);
  return { status: 'applied', label: discount.label };
}

export function clearCode(viewer: Viewer, now: Date = new Date()): void {
  const cart = cartOf(viewer, now);
  cart.discountCode = null;
  touchCart(cart, now);
}
