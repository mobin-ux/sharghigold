/**
 * Discount codes, and what they are worth.
 *
 * **Server-only, and it matters more here than almost anywhere else.** A
 * discount is money, so the table lives where a browser cannot read it: a code
 * list in a client bundle is a list of codes to try, and a discount amount
 * computed in a browser is a discount amount a browser can change.
 *
 * Three properties the design's version does not have:
 *
 *   - A code has a validity window, so a campaign that ended stops working
 *     without anybody remembering to delete it.
 *   - A percentage code has a cap, so «۱۰٪ off» on a large basket is not an
 *     unbounded giveaway.
 *   - A percentage applies to the making fee alone. The gold itself is the
 *     market's price and the VAT is the state's; a shop that discounts either
 *     is selling metal below the rate or paying somebody's tax.
 *
 * The whole table is a placeholder for the `Discount` table `packages/database`
 * already declares. Replacing it is a query, not a redesign: the shape a caller
 * sees is `findDiscount(code, now)` and nothing else.
 */
import type { DiscountKind } from '@sharghigold/contracts';
import { rials, scaleRialsByBasisPoints, type Rials } from '@sharghigold/money';

export interface Discount {
  readonly code: string;
  readonly kind: DiscountKind;
  readonly label: string;
  /** For `making-fee`: the rate, in basis points. */
  readonly basisPoints: number;
  /** For `making-fee`: the most it may ever be worth. */
  readonly capRials: Rials;
  /** For `gift-card`: the face value. */
  readonly amountRials: Rials;
  /** The basket must be worth at least this before the code applies. */
  readonly minimumRials: Rials;
  readonly startsAt: string;
  readonly endsAt: string;
}

const TABLE: readonly Discount[] = [
  {
    code: 'ZARNAMA10',
    kind: 'making-fee',
    label: '۱۰٪ تخفیف اجرت ساخت',
    basisPoints: 1_000,
    capRials: rials(20_000_000n),
    amountRials: rials(0n),
    minimumRials: rials(50_000_000n),
    startsAt: '2026-01-01T00:00:00.000Z',
    endsAt: '2027-01-01T00:00:00.000Z',
  },
  {
    code: 'GIFT500',
    kind: 'gift-card',
    label: 'کارت هدیه ۵۰۰ هزار تومانی',
    basisPoints: 0,
    capRials: rials(0n),
    amountRials: rials(5_000_000n),
    minimumRials: rials(10_000_000n),
    startsAt: '2026-01-01T00:00:00.000Z',
    endsAt: '2027-01-01T00:00:00.000Z',
  },
];

/**
 * The code, if it exists and is live right now.
 *
 * An expired code and an unknown one both come back as `undefined`. That is
 * deliberate: telling a stranger «this code exists but has expired» is telling
 * them which guesses were close, and a code list is worth guessing at.
 */
export function findDiscount(code: string, now: Date): Discount | undefined {
  const found = TABLE.find((entry) => entry.code === code);
  if (found === undefined) return undefined;

  const at = now.getTime();
  if (at < Date.parse(found.startsAt) || at >= Date.parse(found.endsAt)) return undefined;

  return found;
}

/**
 * What a code takes off this basket.
 *
 * Never more than the cap, never more than the making fee it applies to, and
 * never more than the basket is worth — a gift card larger than the order
 * would otherwise turn into a negative total, which is a refund nobody asked
 * for.
 */
export function discountAmount(discount: Discount, makingFee: Rials, goodsTotal: Rials): Rials {
  const raw =
    discount.kind === 'making-fee'
      ? min(scaleRialsByBasisPoints(makingFee, discount.basisPoints), discount.capRials)
      : discount.amountRials;

  return min(min(raw, goodsTotal), makingFeeCeiling(discount, makingFee, raw));
}

/** A making-fee code can never be worth more than the fee itself. */
function makingFeeCeiling(discount: Discount, makingFee: Rials, raw: Rials): Rials {
  return discount.kind === 'making-fee' ? min(raw, makingFee) : raw;
}

function min(left: Rials, right: Rials): Rials {
  return (left < right ? left : right) as Rials;
}
