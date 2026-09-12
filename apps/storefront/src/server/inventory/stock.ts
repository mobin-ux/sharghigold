/**
 * How many of a piece the shop actually has.
 *
 * Its own module, not a field on the product, for the reason
 * `packages/database` already models `InventoryItem` separately from
 * `Product`: a product is a description that changes when somebody edits it,
 * and stock is a count that changes when somebody buys something. Merging them
 * means every sale is a write to the catalogue.
 *
 * PLACEHOLDER, and deliberately in-process. What is real here is the *shape*:
 *
 *   - `available` is asked for by slug and answered by the server. The
 *     product page's `inStock` flag and the stepper's `max` are both hints;
 *     this is the number an order is checked against.
 *   - `reserve` is the only way stock moves, it takes the whole basket at
 *     once, and it either takes everything or nothing. A loop that decrements
 *     one line at a time leaves a half-reserved order behind when the third
 *     line is short.
 *   - Nothing outside this module may write a count.
 *
 * When the database lands, `reserve` becomes one transaction with the rows
 * locked and `SELECT … FOR UPDATE`; the signature does not change, which is
 * the point of it taking the whole basket.
 */
const COUNTS_KEY = Symbol.for('sharghigold.inventory.counts');

interface GlobalWithCounts {
  [COUNTS_KEY]?: Map<string, number>;
}

/**
 * The opening counts.
 *
 * Small numbers on purpose: «تنها ۱ عدد در انبار مانده است» is a state the
 * design draws, and a catalogue where everything has fifty in stock never
 * reaches it.
 */
const SEED: readonly (readonly [string, number])[] = [
  ['classic-solitaire-ring', 5],
  ['delicate-band-ring', 9],
  ['stone-set-dress-ring', 1],
  ['paired-wedding-bands', 3],
  ['rose-gold-solitaire-ring', 0],
];

function counts(): Map<string, number> {
  const holder = globalThis as GlobalWithCounts;
  const existing = holder[COUNTS_KEY];
  if (existing !== undefined) return existing;

  const created = new Map<string, number>(SEED.map(([slug, count]) => [slug, count]));
  holder[COUNTS_KEY] = created;
  return created;
}

/** How many of this piece can still be sold. Zero for anything unknown. */
export function available(productSlug: string): number {
  return counts().get(productSlug) ?? 0;
}

export interface StockRequest {
  readonly productSlug: string;
  readonly quantity: number;
}

export type ReserveResult =
  | { readonly ok: true }
  /** Names the first line that could not be filled, and what is left of it. */
  | { readonly ok: false; readonly productSlug: string; readonly remaining: number };

/**
 * Take the whole basket out of stock, or take none of it.
 *
 * Checked in full before anything is written, so a basket whose last line is
 * short leaves the first lines untouched. In a database this is one
 * transaction; here it is one synchronous pass, which nothing can interleave
 * with for the same reason `settlePayment` cannot be interleaved with.
 */
export function reserve(requests: readonly StockRequest[]): ReserveResult {
  const table = counts();
  const wanted = new Map<string, number>();

  for (const request of requests) {
    wanted.set(request.productSlug, (wanted.get(request.productSlug) ?? 0) + request.quantity);
  }

  for (const [slug, quantity] of wanted) {
    const have = table.get(slug) ?? 0;
    if (have < quantity) return { ok: false, productSlug: slug, remaining: have };
  }

  for (const [slug, quantity] of wanted) {
    table.set(slug, (table.get(slug) ?? 0) - quantity);
  }

  return { ok: true };
}

/**
 * Put stock back.
 *
 * Called when a payment that had already reserved fails, so an abandoned
 * checkout does not quietly consume the last of a piece.
 */
export function release(requests: readonly StockRequest[]): void {
  const table = counts();
  for (const request of requests) {
    table.set(request.productSlug, (table.get(request.productSlug) ?? 0) + request.quantity);
  }
}

/** Throw the counts away. For tests, which must not share state. */
export function resetInventory(): void {
  const holder = globalThis as GlobalWithCounts;
  delete holder[COUNTS_KEY];
}
