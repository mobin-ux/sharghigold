/**
 * The terms checkout offers: where a piece can be collected, when, what
 * delivery costs, and what gift wrapping costs.
 *
 * Server-only, and deliberately not configurable per order. These are one
 * shop's arrangements — two branches, two delivery methods, one wrapping fee —
 * so they are stated once here and read everywhere. The alternative, a fee
 * carried on a request or a branch chosen by id from anywhere, is the shape
 * that lets a customer collect from a branch that does not exist or pay a
 * courier fee they picked themselves (rules 7, 15 and 17).
 *
 * Money is `Rials` held as `bigint`, never a pre-grouped string.
 */
import type { ShippingMethod } from '@sharghigold/contracts';
import { rials, type Rials } from '@sharghigold/money';

import { COURIER_FEE_RIALS } from './shop-policy';

/* -------------------------------------------------------------------------- */
/* Delivery                                                                   */
/* -------------------------------------------------------------------------- */

export interface ShippingChoice {
  readonly method: ShippingMethod;
  readonly title: string;
  readonly note: string;
  readonly costRials: Rials;
  /** True where the fee is waived above `FREE_SHIPPING_ABOVE_RIALS`. */
  readonly freeAboveThreshold: boolean;
  /** Tehran only; the page says so rather than failing at the door. */
  readonly tehranOnly: boolean;
}

/**
 * Insured post above this, free.
 *
 * Twenty million tomans, measured against the value of the goods rather than
 * the payable total: a customer should not lose free delivery by spending a
 * gift card, and should not gain it by adding wrapping.
 */
export const FREE_SHIPPING_ABOVE_RIALS: Rials = rials(200_000_000n);

export const SHIPPING_CHOICES: readonly ShippingChoice[] = [
  {
    method: 'post',
    title: 'پست پیشتاز بیمه‌شده',
    note: '۲ تا ۴ روز کاری · تحویل درب منزل',
    costRials: rials(450_000n),
    freeAboveThreshold: true,
    tehranOnly: false,
  },
  {
    method: 'courier',
    title: 'پیک اختصاصی تهران',
    note: 'تحویل همان روز برای سفارش‌های پیش از ساعت ۱۴',
    costRials: COURIER_FEE_RIALS,
    freeAboveThreshold: false,
    tehranOnly: true,
  },
];

export function findShippingChoice(method: ShippingMethod): ShippingChoice | undefined {
  return SHIPPING_CHOICES.find((choice) => choice.method === method);
}

/**
 * What delivery costs, given what the goods are worth.
 *
 * `goodsRials` is the value of the pieces themselves, before any discount and
 * before wrapping. Computed here rather than on the option so that every
 * caller — the bill, the review card, the order snapshot — reaches the same
 * figure from the same input.
 */
export function shippingCost(choice: ShippingChoice, goodsRials: Rials): Rials {
  if (choice.freeAboveThreshold && goodsRials > FREE_SHIPPING_ABOVE_RIALS) return rials(0n);
  return choice.costRials;
}

/* -------------------------------------------------------------------------- */
/* Collection                                                                 */
/* -------------------------------------------------------------------------- */

export interface Branch {
  readonly id: string;
  readonly title: string;
  readonly line: string;
  readonly hours: string;
  /** Days of the week the branch opens, 0 = Sunday, matching `getUTCDay`. */
  readonly openDays: readonly number[];
}

export const BRANCHES: readonly Branch[] = [
  {
    id: 'grand-bazaar',
    title: 'شعبه مرکزی — بازار طلای تهران',
    line: 'تهران، خیابان پانزده خرداد، سرای فخرآباد، پلاک ۱۱',
    hours: 'شنبه تا پنج‌شنبه، ۱۰ تا ۱۹',
    // Closed Friday (5).
    openDays: [6, 0, 1, 2, 3, 4],
  },
  {
    id: 'saadat-abad',
    title: 'شعبه سعادت‌آباد',
    line: 'تهران، سعادت‌آباد، میدان کاج، مجتمع تجاری زرین، طبقه اول',
    hours: 'هر روز، ۱۱ تا ۲۱',
    openDays: [0, 1, 2, 3, 4, 5, 6],
  },
];

export function findBranch(id: string): Branch | undefined {
  return BRANCHES.find((branch) => branch.id === id);
}

/**
 * The two windows a piece can be collected in, as hours in Tehran time.
 *
 * A window rather than an appointment: the piece is weighed in front of the
 * customer, which takes as long as it takes.
 */
const COLLECTION_WINDOWS = [
  { id: 'morning', fromHour: 10, toHour: 13 },
  { id: 'afternoon', fromHour: 15, toHour: 18 },
] as const;

/** How far ahead collection can be booked. */
const COLLECTION_DAYS = 4;

/**
 * Tehran is UTC+03:30 and does not observe daylight saving.
 *
 * Stated as a constant rather than left to `Intl` because these windows are
 * compared against `now` to decide what has already passed, and a comparison
 * needs an offset, not a formatter.
 */
const TEHRAN_OFFSET_MINUTES = 210;

export interface CollectionSlot {
  /** Stable across a render: an ISO date plus the window. */
  readonly id: string;
  /** The Gregorian date in Tehran, as `YYYY-MM-DD`. */
  readonly date: string;
  readonly fromHour: number;
  readonly toHour: number;
  /** The instant the window closes, for the «has it passed» check. */
  readonly closesAt: string;
}

function tehranParts(at: Date): { year: number; month: number; day: number; minutes: number } {
  const shifted = new Date(at.getTime() + TEHRAN_OFFSET_MINUTES * 60_000);

  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    minutes: shifted.getUTCHours() * 60 + shifted.getUTCMinutes(),
  };
}

function isoDate(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * When a piece can be collected from `branch`, soonest first.
 *
 * Generated from `now` rather than written down, because a fixed list of dates
 * is a list that goes stale the day after it is written — and a checkout that
 * offers yesterday is a checkout that takes a booking nobody will honour.
 *
 * Windows already past are dropped, and days the branch is shut are skipped.
 */
export function collectionSlots(branch: Branch, now: Date): readonly CollectionSlot[] {
  const slots: CollectionSlot[] = [];
  const today = tehranParts(now);

  for (let offset = 0; offset < COLLECTION_DAYS && slots.length < 8; offset += 1) {
    const dayStart = Date.UTC(today.year, today.month - 1, today.day + offset);
    const day = new Date(dayStart);
    const weekday = day.getUTCDay();

    if (!branch.openDays.includes(weekday)) continue;

    for (const window of COLLECTION_WINDOWS) {
      // A window is only offered while there is still time to reach it.
      if (offset === 0 && today.minutes >= window.fromHour * 60 - 60) continue;

      const closesAt = new Date(
        dayStart + (window.toHour * 60 - TEHRAN_OFFSET_MINUTES) * 60_000,
      ).toISOString();

      slots.push({
        id: `${isoDate(day.getUTCFullYear(), day.getUTCMonth() + 1, day.getUTCDate())}:${window.id}`,
        date: isoDate(day.getUTCFullYear(), day.getUTCMonth() + 1, day.getUTCDate()),
        fromHour: window.fromHour,
        toHour: window.toHour,
        closesAt,
      });
    }
  }

  return slots;
}

/** The slot with this id, only if it is still on offer. */
export function findCollectionSlot(
  branch: Branch,
  id: string,
  now: Date,
): CollectionSlot | undefined {
  return collectionSlots(branch, now).find((slot) => slot.id === id);
}

/* -------------------------------------------------------------------------- */
/* Gift wrapping                                                              */
/* -------------------------------------------------------------------------- */

export const GIFT_WRAP = {
  title: 'بسته‌بندی هدیه زرنما',
  note: 'جعبه مخملی، روبان و کارت تبریک دست‌نویس',
  costRials: rials(1_800_000n),
} as const;

/* -------------------------------------------------------------------------- */
/* The banks behind the gateway                                               */
/* -------------------------------------------------------------------------- */

/**
 * The cards the gateway accepts, for the row of chips under it.
 *
 * Names only. Nothing here is a credential, a merchant id or a URL — those
 * belong to the provider integration and never to a page.
 */
export const ACCEPTED_BANKS: readonly string[] = [
  'بانک ملت',
  'بانک سامان',
  'بانک پاسارگاد',
  'سایر کارت‌های شتاب',
];
