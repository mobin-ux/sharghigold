import type { GoldColour } from '@sharghigold/contracts';
import {
  milligrams,
  quoteGoldLine,
  rials,
  RIALS_PER_TOMAN,
  roundTotalToStep,
  sumRials,
  type Rials,
} from '@sharghigold/money';

import { CATALOGUE_RATES } from '@/config/commerce-terms';
import { priceInstallment } from '@/server/policy/installments';

import type {
  InstalmentRecord,
  OrderDeliveryRecord,
  OrderEventRecord,
  OrderLineRecord,
  OrderRecord,
} from './records';

/**
 * The demo account's order history: one order in each state the Orders canvas
 * draws — being prepared, on its way, just delivered, under return, cancelled,
 * and bought on instalments.
 *
 * The dates are relative to when the tables are built, not fixed. A delivered
 * order is only returnable for seven days and an instalment is only «due soon»
 * near its date, so fixed dates would leave a development server a week old
 * with none of those states left to look at.
 *
 * Every bill is priced here with the same money functions checkout uses, so
 * the parts add to the total exactly. Nothing is typed in as a finished figure.
 */

interface Piece {
  readonly productSlug: string | null;
  readonly title: string;
  readonly size: number | null;
  readonly colour: GoldColour | null;
  readonly weightMilligrams: bigint;
  readonly makingFeeBasisPoints: number;
  readonly quantity: number;
}

const wholeToman = (amount: Rials): Rials => roundTotalToStep(amount, RIALS_PER_TOMAN, 'half-up');

function price(pieces: readonly Piece[], ratePerGramRials: bigint) {
  const quotes = pieces.map((piece) => {
    const quote = quoteGoldLine(
      {
        pricePerGram: rials(ratePerGramRials),
        weight: milligrams(piece.weightMilligrams),
        makingFeeBasisPoints: piece.makingFeeBasisPoints,
        ...CATALOGUE_RATES,
      },
      piece.quantity,
    );
    const goldValue = wholeToman(quote.goldValue);
    const makingFee = wholeToman(quote.makingFee);
    const profit = wholeToman(quote.profit);
    const vat = wholeToman(quote.vat);
    return {
      goldValue,
      makingFee,
      profit,
      vat,
      total: sumRials([goldValue, makingFee, profit, vat]),
    };
  });

  const lines: OrderLineRecord[] = pieces.map((piece, index) => ({
    productSlug: piece.productSlug,
    title: piece.title,
    size: piece.size,
    colour: piece.colour,
    weightMilligrams: piece.weightMilligrams * BigInt(piece.quantity),
    quantity: piece.quantity,
    totalRials: quotes[index]?.total ?? 0n,
  }));

  const bill = {
    goldValueRials: sumRials(quotes.map((quote) => quote.goldValue)),
    makingFeeRials: sumRials(quotes.map((quote) => quote.makingFee)),
    profitRials: sumRials(quotes.map((quote) => quote.profit)),
    vatRials: sumRials(quotes.map((quote) => quote.vat)),
    discountRials: 0n,
    // Every demo order is above the free-delivery threshold.
    shippingRials: 0n,
    giftRials: 0n,
  };

  return { lines, bill, total: sumRials(quotes.map((quote) => quote.total)) };
}

function event(
  kind: OrderEventRecord['kind'],
  when: string,
  note: string | null = null,
): OrderEventRecord {
  return { kind, at: when, note };
}

export function seedOrders(customerId: string, mobile: string, now: Date): OrderRecord[] {
  const DAY = 86_400_000;
  /** A moment `days` ago at a Tehran wall-clock time (UTC+3:30). */
  const at = (days: number, hour: number, minute: number): string => {
    const date = new Date(now.getTime() - days * DAY);
    date.setUTCHours(hour, minute - 210, 0, 0);
    return date.toISOString();
  };

  const home: OrderDeliveryRecord = {
    mode: 'ship',
    methodLabel: 'پست پیشتاز بیمه‌شده',
    recipientName: 'کاربر زرنما',
    recipientMobile: mobile,
    addressLine: 'تهران، سعادت‌آباد، خیابان علامه شمالی، کوچه ۱۸، پلاک ۷، واحد ۴',
    postalCode: '1997845613',
  };

  type Defaults = Pick<
    OrderRecord,
    | 'customerId'
    | 'delivery'
    | 'carrier'
    | 'depositRials'
    | 'instalments'
    | 'reserved'
    | 'cancellation'
    | 'returnRequest'
    | 'review'
    | 'messages'
    | 'trackingCode'
    | 'deliveredAt'
  >;

  const blank = (): Defaults => ({
    customerId,
    delivery: home,
    carrier: 'پست پیشتاز',
    depositRials: null,
    instalments: [],
    reserved: [],
    cancellation: null,
    returnRequest: null,
    review: null,
    messages: [],
    trackingCode: null,
    deliveredAt: null,
  });

  const record = (
    code: string,
    placedAt: string,
    rate: bigint,
    pieces: readonly Piece[],
    rest: Partial<Defaults> &
      Pick<OrderRecord, 'state' | 'estimatedAt' | 'events'> & {
        readonly payment: Omit<OrderRecord['payment'], 'paidRials'> & {
          readonly paidRials?: bigint;
        };
      },
  ): OrderRecord => {
    const priced = price(pieces, rate);
    const first = pieces[0];
    return {
      ...blank(),
      ...rest,
      code,
      placedAt,
      ratePerGramRials: rate,
      lines: priced.lines,
      bill: priced.bill,
      title: first?.title ?? 'سفارش زرنما',
      totalRials: priced.total,
      productSlug: pieces.length === 1 ? (first?.productSlug ?? null) : null,
      itemCount: pieces.reduce((count, piece) => count + piece.quantity, 0),
      payment: { ...rest.payment, paidRials: rest.payment.paidRials ?? priced.total },
    };
  };

  const preparingAt = at(1, 14, 2);
  const shippedAt = at(5, 11, 28);
  const deliveredPlacedAt = at(7, 19, 44);
  const returnPlacedAt = at(12, 10, 12);
  const cancelledAt = at(50, 16, 50);
  const instalmentAt = at(70, 9, 30);

  // The instalment order's schedule, priced by the one policy checkout uses.
  const bangles: Piece = {
    productSlug: 'woven-single-bangle',
    title: 'النگو حصیری تک‌پوش',
    size: null,
    colour: 'yellow',
    weightMilligrams: 4_200n,
    makingFeeBasisPoints: 1_600,
    quantity: 2,
  };
  const bangleRate = 99_800_000n;
  const plan = priceInstallment(price([bangles], bangleRate).total, 12);
  const schedule: InstalmentRecord[] = plan.instalments.map((amount, index) => {
    const dueAt = new Date(Date.parse(instalmentAt) + (index + 1) * 30 * DAY).toISOString();
    const paid = Date.parse(dueAt) < now.getTime();
    return {
      dueAt,
      amountRials: amount,
      paidAt: paid ? new Date(Date.parse(dueAt) - 2 * DAY).toISOString() : null,
      reference: paid ? `4410${String(index + 1).padStart(4, '0')}` : null,
    };
  });

  return [
    record(
      'ZN-88412',
      preparingAt,
      104_200_000n,
      [
        {
          productSlug: 'classic-solitaire-ring',
          title: 'انگشتر طلا ۱۸ عیار تک‌نگین کلاسیک',
          size: 54,
          colour: 'yellow',
          weightMilligrams: 3_200n,
          makingFeeBasisPoints: 1_800,
          quantity: 1,
        },
      ],
      {
        state: 'processing',
        payment: { method: 'wallet', label: 'کیف پول زرنما', reference: null, paidAt: preparingAt },
        estimatedAt: at(-3, 18, 0),
        events: [
          event('placed', preparingAt),
          event('paid', at(1, 14, 3)),
          event('preparing', at(1, 18, 40), 'وزن‌کشی و پلمب نهایی انجام شد.'),
        ],
      },
    ),
    record(
      'ZN-88103',
      shippedAt,
      103_600_000n,
      [
        {
          productSlug: 'cartier-chain-bracelet',
          title: 'دستبند زنجیری کارتیه',
          size: null,
          colour: 'yellow',
          weightMilligrams: 4_600n,
          makingFeeBasisPoints: 1_400,
          quantity: 1,
        },
        {
          productSlug: 'name-plate-necklace',
          title: 'گردنبند پلاک اسم',
          size: null,
          colour: 'white',
          weightMilligrams: 900n,
          makingFeeBasisPoints: 1_900,
          quantity: 1,
        },
      ],
      {
        state: 'shipped',
        payment: {
          method: 'gateway',
          label: 'درگاه پرداخت بانکی',
          reference: '99145602',
          paidAt: shippedAt,
        },
        trackingCode: '238945612007',
        estimatedAt: at(-1, 18, 0),
        events: [
          event('placed', shippedAt),
          event('paid', at(5, 11, 29)),
          event('preparing', at(4, 10, 15)),
          event('handed-to-carrier', at(3, 16, 5), 'کد رهگیری پیامک شد.'),
          event('at-hub', at(1, 8, 30), 'مرکز مبادلات تهران'),
        ],
      },
    ),
    record(
      'ZN-87204',
      deliveredPlacedAt,
      102_900_000n,
      [
        {
          productSlug: 'twisted-hoop-earrings',
          title: 'گوشواره حلقه‌ای پیچ',
          size: null,
          colour: 'yellow',
          weightMilligrams: 2_400n,
          makingFeeBasisPoints: 1_700,
          quantity: 1,
        },
      ],
      {
        state: 'delivered',
        payment: {
          method: 'wallet',
          label: 'کیف پول زرنما',
          reference: null,
          paidAt: deliveredPlacedAt,
        },
        trackingCode: '238944901152',
        estimatedAt: at(3, 18, 0),
        deliveredAt: at(3, 13, 5),
        events: [
          event('placed', deliveredPlacedAt),
          event('paid', at(7, 19, 45)),
          event('handed-to-carrier', at(6, 15, 10)),
          event('out-for-delivery', at(3, 9, 20)),
          event('delivered', at(3, 13, 5), 'با امضای گیرنده تحویل شد.'),
        ],
      },
    ),
    record(
      'ZN-86770',
      returnPlacedAt,
      102_400_000n,
      [
        {
          productSlug: null,
          title: 'پلاک گردنبند اسلیمی',
          size: null,
          colour: 'yellow',
          weightMilligrams: 1_700n,
          makingFeeBasisPoints: 2_000,
          quantity: 1,
        },
      ],
      {
        state: 'delivered',
        payment: {
          method: 'gateway',
          label: 'درگاه پرداخت بانکی',
          reference: '55338901',
          paidAt: returnPlacedAt,
        },
        trackingCode: '238941177604',
        estimatedAt: at(9, 18, 0),
        deliveredAt: at(9, 12, 40),
        returnRequest: {
          code: 'RT-41208',
          stage: 'reviewing',
          lineIndexes: [0],
          reason: 'photo-mismatch',
          refundTo: 'wallet',
          note: null,
          // Filled in below from the priced line, never typed.
          refundRials: 0n,
          requestedAt: at(7, 9, 0),
        },
        events: [
          event('placed', returnPlacedAt),
          event('paid', at(12, 10, 13)),
          event('handed-to-carrier', at(11, 14, 30)),
          event('delivered', at(9, 12, 40)),
          event('return-requested', at(7, 9, 0)),
        ],
      },
    ),
    record(
      'ZN-85991',
      cancelledAt,
      98_600_000n,
      [
        {
          productSlug: 'rose-gold-heart-half-set',
          title: 'نیم‌ست قلب رزگلد',
          size: null,
          colour: 'rose',
          weightMilligrams: 5_900n,
          makingFeeBasisPoints: 1_700,
          quantity: 1,
        },
      ],
      {
        state: 'cancelled',
        payment: { method: 'wallet', label: 'کیف پول زرنما', reference: null, paidAt: cancelledAt },
        estimatedAt: null,
        cancellation: { reason: 'not-needed', note: null, at: at(49, 10, 5), refundRials: 0n },
        events: [
          event('placed', cancelledAt),
          event('paid', at(50, 16, 51)),
          event('cancelled', at(49, 10, 5)),
          event('refunded', at(49, 10, 7), 'به کیف پول زرنما'),
        ],
      },
    ),
    record('ZN-85120', instalmentAt, bangleRate, [bangles], {
      state: 'delivered',
      payment: {
        method: 'installment',
        label: 'خرید اقساطی ۱۲ ماهه',
        reference: '33871290',
        paidAt: instalmentAt,
        paidRials: plan.deposit,
      },
      depositRials: plan.deposit,
      instalments: schedule,
      trackingCode: '238930045518',
      estimatedAt: at(66, 18, 0),
      deliveredAt: at(66, 11, 15),
      events: [
        event('placed', instalmentAt),
        event('credit-approved', at(70, 12, 0)),
        event('handed-to-carrier', at(68, 15, 40)),
        event('delivered', at(66, 11, 15)),
      ],
    }),
  ].map((order) => {
    // Refunds and returns are worth what the lines cost, derived from the
    // priced order rather than entered alongside it.
    if (order.returnRequest !== null) {
      const refundRials = order.returnRequest.lineIndexes.reduce(
        (sum, index) => sum + (order.lines[index]?.totalRials ?? 0n),
        0n,
      );
      return { ...order, returnRequest: { ...order.returnRequest, refundRials } };
    }
    if (order.cancellation !== null) {
      return {
        ...order,
        cancellation: { ...order.cancellation, refundRials: order.payment.paidRials },
      };
    }
    return order;
  });
}
