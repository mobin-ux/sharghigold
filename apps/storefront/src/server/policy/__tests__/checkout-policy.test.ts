import { rials } from '@sharghigold/money';
import { describe, expect, it } from 'vitest';

import {
  BRANCHES,
  collectionSlots,
  findBranch,
  findCollectionSlot,
  FREE_SHIPPING_ABOVE_RIALS,
  findShippingChoice,
  shippingCost,
} from '@/server/policy/checkout-policy';
import { installmentOffers, priceInstallment } from '@/server/policy/installments';
import { INSTALLMENT } from '@/server/policy/shop-policy';

/**
 * The shop's own terms.
 *
 * Two things are pinned here: that a collection window is generated from the
 * clock rather than written down — a fixed list of dates is a list that offers
 * yesterday — and that the instalment arithmetic adds up, since it is the one
 * place the shop quotes a figure a customer will pay twelve times.
 */

/* -------------------------------------------------------------------------- */
/* Delivery                                                                   */
/* -------------------------------------------------------------------------- */

describe('what delivery costs', () => {
  it('waives the post above the threshold and charges below it', () => {
    const post = findShippingChoice('post');
    if (post === undefined) throw new Error('the post is not offered');

    expect(shippingCost(post, rials(FREE_SHIPPING_ABOVE_RIALS + 1n))).toBe(0n);
    expect(shippingCost(post, rials(FREE_SHIPPING_ABOVE_RIALS))).toBe(post.costRials);
  });

  it('never waives the courier, however large the order', () => {
    const courier = findShippingChoice('courier');
    if (courier === undefined) throw new Error('the courier is not offered');

    expect(shippingCost(courier, rials(999_999_999_999n))).toBe(courier.costRials);
  });
});

/* -------------------------------------------------------------------------- */
/* Collection                                                                 */
/* -------------------------------------------------------------------------- */

describe('when a piece can be collected', () => {
  /** A Sunday at 08:00 Tehran time, before either window has opened. */
  const EARLY = new Date('2026-09-13T04:30:00.000Z');

  it('offers today’s windows while there is still time to reach them', () => {
    const branch = BRANCHES[0];
    if (branch === undefined) throw new Error('no branches');

    const slots = collectionSlots(branch, EARLY);
    expect(slots[0]?.date).toBe('2026-09-13');
    expect(slots[0]?.fromHour).toBe(10);
  });

  it('drops a window that has already started', () => {
    const branch = BRANCHES[0];
    if (branch === undefined) throw new Error('no branches');

    // 16:00 Tehran: the morning window has gone and the afternoon one has
    // begun, so the soonest offer is tomorrow.
    const late = new Date('2026-09-13T12:30:00.000Z');
    expect(collectionSlots(branch, late)[0]?.date).toBe('2026-09-14');
  });

  it('skips a day the branch is shut', () => {
    const closed = findBranch('grand-bazaar');
    const everyDay = findBranch('saadat-abad');
    if (closed === undefined || everyDay === undefined) throw new Error('missing a branch');

    // 2026-09-18 is a Friday; the bazaar branch does not open.
    const beforeFriday = new Date('2026-09-17T04:30:00.000Z');
    expect(collectionSlots(closed, beforeFriday).some((slot) => slot.date === '2026-09-18')).toBe(
      false,
    );
    expect(collectionSlots(everyDay, beforeFriday).some((slot) => slot.date === '2026-09-18')).toBe(
      true,
    );
  });

  it('does not recognise a window it is no longer offering', () => {
    const branch = BRANCHES[0];
    if (branch === undefined) throw new Error('no branches');

    const slot = collectionSlots(branch, EARLY)[0];
    if (slot === undefined) throw new Error('no slots');

    expect(findCollectionSlot(branch, slot.id, EARLY)?.id).toBe(slot.id);
    // A week later the same booking is simply not on offer, so it cannot be
    // kept on a draft and turned into an appointment nobody will keep.
    const nextWeek = new Date(EARLY.getTime() + 7 * 86_400_000);
    expect(findCollectionSlot(branch, slot.id, nextWeek)).toBeUndefined();
  });
});

/* -------------------------------------------------------------------------- */
/* Instalments                                                                */
/* -------------------------------------------------------------------------- */

describe('an instalment purchase', () => {
  const TOTAL = rials(324_600_000n);

  it('takes the stated deposit today', () => {
    const priced = priceInstallment(TOTAL, 12);
    const expected = (TOTAL * BigInt(INSTALLMENT.depositBasisPoints)) / 10_000n;

    expect(priced.deposit).toBe(expected);
  });

  it('adds up: the deposit and every instalment make the quoted total', () => {
    for (const months of INSTALLMENT.terms) {
      const priced = priceInstallment(TOTAL, months);
      const paid = priced.instalments.reduce<bigint>((sum, part) => sum + part, priced.deposit);

      expect(paid, `${months} months`).toBe(priced.total);
    }
  });

  it('costs more than paying outright, and more the longer the term', () => {
    const short = priceInstallment(TOTAL, 6);
    const long = priceInstallment(TOTAL, 18);

    expect(short.total).toBeGreaterThan(TOTAL);
    expect(long.total).toBeGreaterThan(short.total);
  });

  it('never quotes a monthly figure that leaves the balance short', () => {
    for (const months of INSTALLMENT.terms) {
      const priced = priceInstallment(TOTAL, months);
      // Paying the quoted figure every month must clear what is owed.
      expect(priced.monthly * BigInt(months), `${months} months`).toBeGreaterThanOrEqual(
        priced.total - priced.deposit,
      );
    }
  });

  it('offers every term the shop says it offers', () => {
    expect(installmentOffers(TOTAL).map((offer) => offer.months)).toEqual([...INSTALLMENT.terms]);
  });

  it('refuses a term that is not a whole number of months', () => {
    expect(() => priceInstallment(TOTAL, 0)).toThrow(RangeError);
    expect(() => priceInstallment(TOTAL, 1.5)).toThrow(RangeError);
  });
});
