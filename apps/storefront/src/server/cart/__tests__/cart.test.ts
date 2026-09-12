import { CART_MAX_QUANTITY } from '@sharghigold/contracts';
import { beforeEach, describe, expect, it } from 'vitest';

import { keyedDigest, newToken } from '@/server/account/crypto';
import { resetAllRateLimits } from '@/server/account/rate-limit';
import type { Viewer } from '@/server/account/session';
import {
  DEMO_MOBILE,
  findCart,
  insertSession,
  newSessionId,
  resetAccountStore,
  upsertCustomer,
  type CustomerRecord,
} from '@/server/account/store';
import {
  addToCart,
  applyCode,
  clearCode,
  dropSaved,
  keepForLater,
  lockExpired,
  lockRemaining,
  priceCart,
  refreshRate,
  removeLine,
  restoreSaved,
  setLineQuantity,
  viewCart,
} from '@/server/cart/cart';
import { cartTotals, deliveryLine } from '@/server/cart/pricing';
import { available, resetInventory } from '@/server/inventory/stock';

/**
 * The basket.
 *
 * What is pinned is what would cost somebody money or a piece of stock if it
 * were wrong: a quantity that outruns the shelf, a discount worth more than
 * the thing it discounts, a price lock that never expires, and one customer
 * reaching another's basket.
 */
const NOW = new Date('2026-09-12T09:00:00.000Z');
const later = (seconds: number) => new Date(NOW.getTime() + seconds * 1_000);

const OTHER_MOBILE = '09121110000';

/** The ring with five in stock, and the one with a single piece left. */
const PLENTIFUL = 'classic-solitaire-ring';
const SCARCE = 'stone-set-dress-ring';
const GONE = 'rose-gold-solitaire-ring';

function viewerFor(customer: CustomerRecord): Viewer {
  const session = insertSession({
    id: newSessionId(),
    customerId: customer.id,
    tokenHash: keyedDigest(newToken()),
    createdAt: NOW.toISOString(),
    lastSeenAt: NOW.toISOString(),
    expiresAt: later(3_600).toISOString(),
    revokedAt: null,
    userAgent: null,
    place: null,
  });
  return { customer, session };
}

function twoCustomers() {
  return {
    mine: viewerFor(upsertCustomer(DEMO_MOBILE, NOW)),
    theirs: viewerFor(upsertCustomer(OTHER_MOBILE, NOW)),
  };
}

/** The basket record, which the callers below have always just created. */
function cartOf(viewer: Viewer) {
  const cart = findCart(viewer.customer.id);
  if (cart === undefined) throw new Error('no basket');
  return cart;
}

/** Start from an empty basket: the seeded one gets in the way of counting. */
function emptied(viewer: Viewer): Viewer {
  const cart = findCart(viewer.customer.id);
  if (cart !== undefined) {
    cart.lines = [];
    cart.saved = [];
    cart.discountCode = null;
  }
  return viewer;
}

beforeEach(() => {
  resetAccountStore();
  resetInventory();
  resetAllRateLimits();
});

/* -------------------------------------------------------------------------- */
/* Putting something in                                                       */
/* -------------------------------------------------------------------------- */

describe('adding a piece', () => {
  it('adds what was chosen and nothing about what it costs', async () => {
    const { mine } = twoCustomers();
    emptied(mine);

    const added = await addToCart(
      mine,
      { productSlug: PLENTIFUL, size: 54, colour: 'yellow', quantity: 1 },
      NOW,
    );
    expect(added.status).toBe('added');

    const cart = await viewCart(mine, NOW);
    expect(cart.lines).toHaveLength(1);
    expect(cart.lines[0]?.productSlug).toBe(PLENTIFUL);
    // The price is the server's, derived from the catalogue.
    expect(BigInt(cart.lines[0]?.lineTotalRials ?? '0')).toBeGreaterThan(0n);
  });

  it('refuses a size the piece is not made in', async () => {
    const { mine } = twoCustomers();
    // 58 and 62 are the sizes this ring does not come in.
    const refused = await addToCart(
      mine,
      { productSlug: PLENTIFUL, size: 58, colour: 'yellow', quantity: 1 },
      NOW,
    );
    expect(refused.status).toBe('unavailable-size');
  });

  it('refuses a colour the workshop does not offer in this piece', async () => {
    const { mine } = twoCustomers();
    // The rose-gold solitaire is not made in white.
    const refused = await addToCart(
      mine,
      { productSlug: GONE, size: 54, colour: 'white', quantity: 1 },
      NOW,
    );
    expect(refused.status).toBe('unknown-product');
  });

  it('refuses a product that does not exist', async () => {
    const { mine } = twoCustomers();
    const refused = await addToCart(
      mine,
      { productSlug: 'not-a-ring', size: null, colour: 'yellow', quantity: 1 },
      NOW,
    );
    expect(refused.status).toBe('unknown-product');
  });

  it('will not put more in the basket than the shop has', async () => {
    const { mine } = twoCustomers();
    emptied(mine);

    // One left of the dress ring, so a second is refused.
    expect(
      (await addToCart(mine, { productSlug: SCARCE, size: 54, colour: 'yellow', quantity: 1 }, NOW))
        .status,
    ).toBe('added');
    expect(
      (await addToCart(mine, { productSlug: SCARCE, size: 54, colour: 'yellow', quantity: 1 }, NOW))
        .status,
    ).toBe('out-of-stock');
  });

  it('adds to the line already there rather than making a second row', async () => {
    const { mine } = twoCustomers();
    emptied(mine);

    const choice = { productSlug: PLENTIFUL, size: 54, colour: 'yellow' } as const;
    await addToCart(mine, { ...choice, quantity: 1 }, NOW);
    await addToCart(mine, { ...choice, quantity: 2 }, NOW);

    const cart = await viewCart(mine, NOW);
    expect(cart.lines).toHaveLength(1);
    expect(cart.lines[0]?.quantity).toBe(3);
  });

  it('treats a different size as a different line', async () => {
    const { mine } = twoCustomers();
    emptied(mine);

    await addToCart(mine, { productSlug: PLENTIFUL, size: 54, colour: 'yellow', quantity: 1 }, NOW);
    await addToCart(mine, { productSlug: PLENTIFUL, size: 56, colour: 'yellow', quantity: 1 }, NOW);

    expect((await viewCart(mine, NOW)).lines).toHaveLength(2);
  });

  it('does not take stock out of the shelf just by being wanted', async () => {
    const { mine } = twoCustomers();
    emptied(mine);

    const before = available(PLENTIFUL);
    await addToCart(mine, { productSlug: PLENTIFUL, size: 54, colour: 'yellow', quantity: 2 }, NOW);

    // Stock moves when an order is placed, not when a basket is filled — or a
    // browsing session would empty the shop.
    expect(available(PLENTIFUL)).toBe(before);
  });
});

/* -------------------------------------------------------------------------- */
/* Changing a line                                                            */
/* -------------------------------------------------------------------------- */

describe('changing a line', () => {
  it('clamps a quantity to what the shop actually has', async () => {
    const { mine } = twoCustomers();
    emptied(mine);
    await addToCart(mine, { productSlug: SCARCE, size: 54, colour: 'yellow', quantity: 1 }, NOW);

    const line = (await viewCart(mine, NOW)).lines[0];
    const asked = setLineQuantity(mine, line?.id ?? '', 9, NOW);

    expect(asked.status).toBe('out-of-stock');
    expect((await viewCart(mine, NOW)).lines[0]?.quantity).toBe(1);
  });

  it('never lets a line exceed the per-line cap', async () => {
    const { mine } = twoCustomers();
    emptied(mine);
    await addToCart(mine, { productSlug: PLENTIFUL, size: 54, colour: 'yellow', quantity: 1 }, NOW);

    const line = (await viewCart(mine, NOW)).lines[0];
    setLineQuantity(mine, line?.id ?? '', CART_MAX_QUANTITY + 5, NOW);

    expect((await viewCart(mine, NOW)).lines[0]?.quantity).toBeLessThanOrEqual(CART_MAX_QUANTITY);
  });

  it('refuses zero and negative quantities, because removing is its own act', async () => {
    const { mine } = twoCustomers();
    emptied(mine);
    await addToCart(mine, { productSlug: PLENTIFUL, size: 54, colour: 'yellow', quantity: 2 }, NOW);
    const line = (await viewCart(mine, NOW)).lines[0];

    expect(setLineQuantity(mine, line?.id ?? '', 0, NOW).status).toBe('no-such-line');
    expect(setLineQuantity(mine, line?.id ?? '', -3, NOW).status).toBe('no-such-line');
    expect((await viewCart(mine, NOW)).lines[0]?.quantity).toBe(2);
  });

  it('says nothing about a line that is not in this basket', async () => {
    const { mine, theirs } = twoCustomers();
    emptied(mine);
    emptied(theirs);
    await addToCart(
      theirs,
      { productSlug: PLENTIFUL, size: 54, colour: 'yellow', quantity: 1 },
      NOW,
    );

    const line = (await viewCart(theirs, NOW)).lines[0];

    expect(setLineQuantity(mine, line?.id ?? '', 5, NOW).status).toBe('no-such-line');
    expect(removeLine(mine, line?.id ?? '', NOW)).toBe(false);
    expect((await viewCart(theirs, NOW)).lines[0]?.quantity).toBe(1);
  });
});

/* -------------------------------------------------------------------------- */
/* Saving for later                                                           */
/* -------------------------------------------------------------------------- */

describe('setting a piece aside', () => {
  it('moves it out of the basket and back again', async () => {
    const { mine } = twoCustomers();
    emptied(mine);
    await addToCart(mine, { productSlug: PLENTIFUL, size: 54, colour: 'yellow', quantity: 1 }, NOW);

    const line = (await viewCart(mine, NOW)).lines[0];
    expect(keepForLater(mine, line?.id ?? '', NOW)).toBe(true);

    const kept = await viewCart(mine, NOW);
    expect(kept.lines).toHaveLength(0);
    expect(kept.saved).toHaveLength(1);

    expect(restoreSaved(mine, kept.saved[0]?.id ?? '', NOW).status).toBe('restored');
    expect((await viewCart(mine, NOW)).lines).toHaveLength(1);
  });

  it('will not restore a piece the shop has run out of', async () => {
    const { mine } = twoCustomers();
    const saved = (await viewCart(mine, NOW)).saved.find((entry) => entry.productSlug === GONE);

    expect(saved?.orderable).toBe(false);
    expect(restoreSaved(mine, saved?.id ?? '', NOW).status).toBe('out-of-stock');
  });

  it('hides one customer’s saved pieces from another', async () => {
    const { mine, theirs } = twoCustomers();
    emptied(theirs);
    const saved = (await viewCart(mine, NOW)).saved[0];

    expect(dropSaved(theirs, saved?.id ?? '', NOW)).toBe(false);
    expect((await viewCart(mine, NOW)).saved).not.toHaveLength(0);
  });
});

/* -------------------------------------------------------------------------- */
/* Discount codes                                                             */
/* -------------------------------------------------------------------------- */

describe('a discount code', () => {
  it('takes a percentage off the making fee and the tax that follows it', async () => {
    const { mine } = twoCustomers();

    const before = await priceCart(mine, {}, NOW);
    expect((await applyCode(mine, 'zarnama10', NOW)).status).toBe('applied');
    const after = await priceCart(mine, {}, NOW);

    expect(after.quote.discountRials).toBeGreaterThan(0n);
    expect(after.quote.total).toBeLessThan(before.quote.total);

    // The gold is untouched and the VAT follows the discounted fee down —
    // charging tax on a fee nobody paid overcharges on every discounted order.
    expect(after.quote.goldValue).toBe(before.quote.goldValue);
    expect(after.quote.vat).toBeLessThan(before.quote.vat);
  });

  it('produces a bill that still adds up to the total', async () => {
    const { mine } = twoCustomers();
    await applyCode(mine, 'ZARNAMA10', NOW);

    const cart = await viewCart(mine, NOW);
    const summed = cart.totals.lines.reduce((total, line) => total + BigInt(line.amountRials), 0n);

    expect(summed).toBe(BigInt(cart.totals.totalRials));
  });

  it('prints every figure in the unit it charges in', async () => {
    // The shop quotes tomans. A line rounded only at the formatter truncates
    // its own rial remainder, and five such lines print a total a toman below
    // the one underneath them — arithmetic a customer can check and find wrong.
    const { mine } = twoCustomers();
    await applyCode(mine, 'ZARNAMA10', NOW);

    const cart = await viewCart(mine, NOW);
    for (const line of cart.totals.lines) {
      expect(BigInt(line.amountRials) % 10n, line.kind).toBe(0n);
    }
    for (const line of cart.lines) {
      expect(BigInt(line.lineTotalRials) % 10n).toBe(0n);
      expect(BigInt(line.unitTotalRials) % 10n).toBe(0n);
    }
    expect(BigInt(cart.totals.totalRials) % 10n).toBe(0n);
  });

  it('adds up with a gift card, with wrapping, and with neither', async () => {
    const { mine } = twoCustomers();

    for (const code of [undefined, 'ZARNAMA10', 'GIFT500']) {
      if (code === undefined) clearCode(mine, NOW);
      else await applyCode(mine, code, NOW);

      for (const gift of [false, true]) {
        const { quote } = await priceCart(mine, { gift }, NOW);
        const totals = cartTotals(quote, quote.total, deliveryLine(quote, 'ship'));
        const summed = totals.lines.reduce((sum, line) => sum + BigInt(line.amountRials), 0n);

        expect(summed, `${String(code)} gift=${String(gift)}`).toBe(BigInt(totals.totalRials));
      }
    }
  });

  it('answers an unknown code and an expired one identically', async () => {
    const { mine } = twoCustomers();

    expect((await applyCode(mine, 'NOTACODE', NOW)).status).toBe('unknown');
    expect((await applyCode(mine, 'ZARNAMA10', new Date('2030-01-01T00:00:00Z'))).status).toBe(
      'unknown',
    );
  });

  it('refuses a code on a basket below its minimum', async () => {
    const { mine } = twoCustomers();
    emptied(mine);

    const refused = await applyCode(mine, 'ZARNAMA10', NOW);
    expect(refused.status).toBe('nothing-to-discount');
  });

  it('stores the code and never the amount it was worth', async () => {
    const { mine } = twoCustomers();
    await applyCode(mine, 'ZARNAMA10', NOW);

    const withEverything = await priceCart(mine, {}, NOW);
    const worthBefore = withEverything.quote.discountRials;

    // Empty the basket: the discount has to go with it, because what it saves
    // is recomputed and never written down.
    emptied(mine);
    expect((await priceCart(mine, {}, NOW)).quote.discountRials).toBe(0n);
    expect(worthBefore).toBeGreaterThan(0n);
  });

  it('never gives away more than the making fee itself', async () => {
    const { mine } = twoCustomers();
    await applyCode(mine, 'ZARNAMA10', NOW);

    const { quote } = await priceCart(mine, {}, NOW);
    expect(quote.discountRials).toBeLessThanOrEqual(quote.makingFee);
    expect(quote.total).toBeGreaterThan(quote.goldValue);
  });

  it('is dropped when it is taken off', async () => {
    const { mine } = twoCustomers();
    await applyCode(mine, 'ZARNAMA10', NOW);
    clearCode(mine, NOW);

    expect((await priceCart(mine, {}, NOW)).quote.discount).toBeNull();
  });
});

/* -------------------------------------------------------------------------- */
/* The price lock                                                             */
/* -------------------------------------------------------------------------- */

describe('the price lock', () => {
  it('counts down from when it was struck, not from when the page was opened', () => {
    const { mine } = twoCustomers();
    refreshRate(mine, NOW);

    expect(lockRemaining(cartOf(mine), NOW)).toBe(300);
    expect(lockRemaining(cartOf(mine), later(120))).toBe(180);
  });

  it('actually expires', () => {
    const { mine } = twoCustomers();
    refreshRate(mine, NOW);

    expect(lockExpired(cartOf(mine), later(299))).toBe(false);
    expect(lockExpired(cartOf(mine), later(301))).toBe(true);
  });

  it('is not re-struck by looking at the basket', async () => {
    const { mine } = twoCustomers();
    refreshRate(mine, NOW);

    await viewCart(mine, later(60));
    await viewCart(mine, later(120));

    expect((await viewCart(mine, later(180))).secondsRemaining).toBe(120);
  });

  it('is re-struck only when asked', async () => {
    const { mine } = twoCustomers();
    refreshRate(mine, NOW);
    refreshRate(mine, later(200));

    expect((await viewCart(mine, later(200))).secondsRemaining).toBe(300);
  });
});
