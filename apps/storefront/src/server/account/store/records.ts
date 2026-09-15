/**
 * The rows the development store holds.
 *
 * The shape here is the shape `packages/database` already declares, so
 * replacing `store/` with Prisma queries is a substitution and not a redesign.
 *
 * One deliberate absence: there are no passwords, codes or tokens in plain form
 * anywhere in these records. They hold hashes, because the day this becomes a
 * database is the day it becomes something that can leak.
 */

import type {
  AddressLabel,
  CancelReason,
  CheckoutPayment,
  OrderEventKind,
  RefundDestination,
  ReturnReason,
  ReturnStage,
  ReviewTag,
  DeliveryMode,
  GoldColour,
  InvoiceType,
  KycStatus,
  OrderPaymentState,
  OrderState,
  PaymentMethod,
  PaymentStatus,
  ShippingMethod,
} from '@sharghigold/contracts';

export interface CustomerRecord {
  readonly id: string;
  readonly mobile: string;
  displayName: string | null;
  nationalId: string | null;
  birthDate: string | null;
  iban: string | null;
  kycStatus: KycStatus;
  kycRejectionReason: string | null;
  /** Issued when the selfie step is opened; cleared once it is submitted. */
  selfieChallenge: string | null;
  selfieSubmittedAt: string | null;
  passwordHash: string | null;
  readonly joinedAt: string;
  walletRials: bigint;
  walletUpdatedAt: string;
  goldMilligrams: bigint;
  favouriteCount: number;
  unreadMessageCount: number;
}

export interface AddressRecord {
  readonly id: string;
  readonly customerId: string;
  label: AddressLabel;
  recipientName: string;
  recipientMobile: string;
  province: string;
  city: string;
  line: string;
  plate: string;
  unit: string | null;
  postalCode: string;
  isDefault: boolean;
}

export interface SessionRecord {
  readonly id: string;
  readonly customerId: string;
  readonly tokenHash: string;
  readonly createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
  revokedAt: string | null;
  readonly userAgent: string | null;
  readonly place: string | null;
}

export interface OtpRecord {
  readonly mobile: string;
  readonly codeHash: string;
  readonly expiresAt: string;
  attempts: number;
  consumedAt: string | null;
}

/**
 * One attempt to put money into the wallet.
 *
 * `amountRials` is written when the payment is created and never again: the
 * figure the customer is charged is the figure the shop decided on, and
 * nothing that comes back from a browser or a bank may change it. `authority`
 * is the handle the provider gave us to ask about this payment later, which is
 * the only thing the settlement step is allowed to act on.
 */
export interface PaymentRecord {
  readonly id: string;
  readonly customerId: string;
  readonly reference: string;
  readonly amountRials: bigint;
  readonly method: PaymentMethod;
  readonly authority: string;
  status: PaymentStatus;
  readonly createdAt: string;
  settledAt: string | null;
  /** The balance this payment left behind, recorded when it was applied. */
  balanceAfterRials: bigint | null;
}

/**
 * One chosen piece, sitting in a basket.
 *
 * What it carries is what was *chosen* — the product, the size, the colour and
 * how many. There is no price on it and there never will be: a stored basket
 * price is a price that goes stale the moment gold moves, and a price a
 * request could have written is a price the customer chose.
 */
export interface CartLineRecord {
  readonly id: string;
  readonly productSlug: string;
  readonly size: number | null;
  readonly colour: GoldColour;
  quantity: number;
  readonly addedAt: string;
}

/**
 * A customer's basket.
 *
 * `ratePerGramRials` and `rateQuotedAt` are the price lock, held on the basket
 * rather than recomputed per render. That is the whole of what makes the
 * countdown mean something: a figure re-struck on every page load never
 * expires, and a lock that never expires is not a lock.
 */
export interface CartRecord {
  readonly customerId: string;
  lines: CartLineRecord[];
  /** Set aside for later. Not being bought, so quantity is not read. */
  saved: CartLineRecord[];
  discountCode: string | null;
  ratePerGramRials: bigint;
  rateQuotedAt: string;
  updatedAt: string;
}

/**
 * The choices made on the way to paying, held on the server.
 *
 * Each checkout screen owns a few of these fields and writes only those. They
 * are stored rather than posted forward through hidden inputs, because a
 * hidden input carrying «which address» is an input that can name somebody
 * else's — and one carrying «which payment method» is one that can name a
 * method the shop refused.
 */
export interface CheckoutDraftRecord {
  readonly customerId: string;
  mode: DeliveryMode;
  addressId: string | null;
  shipping: ShippingMethod;
  branchId: string;
  slotId: string | null;
  gift: boolean;
  recipientName: string | null;
  recipientMobile: string | null;
  notes: string;
  payment: CheckoutPayment;
  installmentMonths: number;
  invoice: InvoiceType;
  companyName: string | null;
  companyCode: string | null;
  termsAcceptedAt: string | null;
  /**
   * A one-shot token the review screen renders and placing an order consumes.
   *
   * Without it, two taps on «پرداخت و ثبت سفارش» are two orders. The token is
   * cleared inside the same synchronous pass that reserves the stock, so the
   * second request finds it gone and is answered with the order the first one
   * made rather than a second charge.
   */
  intent: string | null;
  /**
   * The token that was actually spent, and the order it produced.
   *
   * Kept as a pair. A repeat of *that* token is answered with *that* order; a
   * token from some later checkout is stale, and must not be answered with an
   * order the customer placed last week.
   */
  spentIntent: string | null;
  placedCode: string | null;
  /**
   * Development only: which ending the simulated provider should stage.
   *
   * Read by `placeOrder` only where `paymentsAvailable()` is true, which is
   * false in production — so the field cannot steer a real payment even if
   * somebody posts it.
   */
  simulate: string | null;
  updatedAt: string;
}

/**
 * An order as it was placed, frozen.
 *
 * Every amount here was computed once, at the moment the customer pressed pay,
 * and is never recomputed. An order from August has to keep saying what August
 * cost however far gold has moved since — and the figure that was charged has
 * to be the figure that is shown, or the receipt is fiction.
 *
 * `reserved` is what was taken out of stock, so a payment that fails can put
 * exactly that back.
 */
export interface OrderSnapshotRecord {
  readonly code: string;
  readonly customerId: string;
  readonly placedAt: string;
  paymentState: OrderPaymentState;
  readonly payment: CheckoutPayment;
  readonly paymentLabel: string;
  readonly totalRials: bigint;
  readonly paidRials: bigint;
  readonly itemCount: number;
  readonly title: string;
  readonly productSlug: string | null;
  readonly deliveryMode: DeliveryMode;
  readonly deliveryLabel: string;
  /** The handle the provider gave us, when a provider was involved. */
  readonly authority: string | null;
  reference: string | null;
  failureReason: 'declined' | 'abandoned' | 'insufficient-funds' | null;
  settledAt: string | null;
  readonly reserved: readonly { readonly productSlug: string; readonly quantity: number }[];
  /** What was taken from the wallet, so a failure can put exactly it back. */
  readonly walletDebitRials: bigint;
  /** What the order history keeps once the payment succeeds. */
  readonly detail: OrderDetailSnapshot;
}

/**
 * The parts of an order record that are fixed at the moment of placing.
 *
 * Carried on the snapshot so that settling — which may happen in a later
 * request, once a bank answers — writes the history row from what was priced,
 * not from a basket that has moved on since.
 */
export type OrderDetailSnapshot = Pick<
  OrderRecord,
  | 'lines'
  | 'bill'
  | 'ratePerGramRials'
  | 'delivery'
  | 'depositRials'
  | 'instalments'
  | 'carrier'
  | 'estimatedAt'
>;

/**
 * One movement of money in or out of a wallet.
 *
 * The balance on the customer record is the *sum* of these, not a separate
 * fact. It was the only record of the wallet, which meant the account could
 * show a figure with nothing behind it: a customer whose balance had dropped
 * had no way to find out what had taken it, and neither did support.
 *
 * `balanceAfterRials` is stamped at the time of the entry. Recomputing a
 * running balance when the ledger is read gives a different answer every time
 * a row is inserted out of order, and the figure a customer was shown when
 * they looked is the one they will quote back.
 *
 * This is `WalletTransaction` in `packages/database`, written out here for the
 * same reason as every other table in this file.
 */
export interface WalletEntryRecord {
  readonly id: string;
  readonly customerId: string;
  readonly at: string;
  /** Positive for money in, negative for money out. Whole rials. */
  readonly amountRials: bigint;
  readonly balanceAfterRials: bigint;
  readonly kind: 'top-up' | 'order' | 'refund';
  /** What it was for, in the customer's words. */
  readonly label: string;
  /** The order code or payment reference it belongs to, when there is one. */
  readonly reference: string | null;
}

/** One piece of an order, as it was bought. */
export interface OrderLineRecord {
  readonly productSlug: string | null;
  readonly title: string;
  readonly size: number | null;
  readonly colour: GoldColour | null;
  readonly weightMilligrams: bigint;
  readonly quantity: number;
  readonly totalRials: bigint;
}

/** The bill, part by part. Frozen with the order; the parts add to its total. */
export interface OrderBillRecord {
  readonly goldValueRials: bigint;
  readonly makingFeeRials: bigint;
  readonly profitRials: bigint;
  readonly vatRials: bigint;
  readonly discountRials: bigint;
  readonly shippingRials: bigint;
  readonly giftRials: bigint;
}

/**
 * Where the order went, copied when it was placed.
 *
 * A copy and not an address id, as `Order.ship*` is in `packages/database`:
 * editing the address book later must not rewrite where a past order was sent.
 */
export interface OrderDeliveryRecord {
  readonly mode: DeliveryMode;
  readonly methodLabel: string;
  readonly recipientName: string | null;
  readonly recipientMobile: string | null;
  readonly addressLine: string | null;
  readonly postalCode: string | null;
}

/** Something that has happened to an order. Only the past is stored. */
export interface OrderEventRecord {
  readonly kind: OrderEventKind;
  readonly at: string;
  readonly note: string | null;
}

export interface InstalmentRecord {
  readonly dueAt: string;
  readonly amountRials: bigint;
  paidAt: string | null;
  reference: string | null;
}

export interface OrderReturnRecord {
  readonly code: string;
  stage: ReturnStage;
  readonly lineIndexes: readonly number[];
  readonly reason: ReturnReason;
  readonly refundTo: RefundDestination;
  readonly note: string | null;
  /** Computed from the chosen lines when the request was made. */
  readonly refundRials: bigint;
  readonly requestedAt: string;
}

export interface OrderRecord {
  readonly customerId: string;
  readonly code: string;
  readonly placedAt: string;
  state: OrderState;
  readonly title: string;
  readonly totalRials: bigint;
  readonly productSlug: string | null;
  readonly itemCount: number;
  readonly lines: readonly OrderLineRecord[];
  readonly bill: OrderBillRecord;
  /** The 18-karat rate per gram the order was priced at. */
  readonly ratePerGramRials: bigint | null;
  readonly payment: {
    readonly method: CheckoutPayment;
    readonly label: string;
    readonly reference: string | null;
    readonly paidAt: string | null;
    /** What was taken when the order was placed: the total, or a deposit. */
    readonly paidRials: bigint;
  };
  readonly depositRials: bigint | null;
  /** Empty for anything but an instalment purchase. */
  readonly instalments: InstalmentRecord[];
  readonly delivery: OrderDeliveryRecord;
  readonly carrier: string | null;
  readonly trackingCode: string | null;
  readonly estimatedAt: string | null;
  deliveredAt: string | null;
  readonly events: OrderEventRecord[];
  /** What was taken out of stock, so a cancellation can put exactly it back. */
  readonly reserved: readonly { readonly productSlug: string; readonly quantity: number }[];
  cancellation: {
    readonly reason: CancelReason;
    readonly note: string | null;
    readonly at: string;
    readonly refundRials: bigint;
  } | null;
  returnRequest: OrderReturnRecord | null;
  review: {
    readonly ratings: readonly number[];
    readonly body: string | null;
    readonly tags: readonly ReviewTag[];
    readonly anonymous: boolean;
    readonly submittedAt: string;
  } | null;
  readonly messages: {
    readonly from: 'customer' | 'shop';
    readonly body: string;
    readonly at: string;
  }[];
}

/** Every table, as one object. Built and seeded by `tables.ts`. */
export interface Tables {
  readonly customers: Map<string, CustomerRecord>;
  readonly byMobile: Map<string, string>;
  readonly addresses: Map<string, AddressRecord>;
  readonly sessions: Map<string, SessionRecord>;
  readonly challenges: Map<string, OtpRecord>;
  readonly orders: OrderRecord[];
  readonly payments: Map<string, PaymentRecord>;
  readonly carts: Map<string, CartRecord>;
  readonly drafts: Map<string, CheckoutDraftRecord>;
  readonly placedOrders: Map<string, OrderSnapshotRecord>;
  readonly walletEntries: WalletEntryRecord[];
}
