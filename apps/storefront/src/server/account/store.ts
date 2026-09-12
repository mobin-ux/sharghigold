/**
 * Where account records live while there is no database behind them.
 *
 * Server-only, and **development-only**. Every entry point below calls
 * `assertAvailable()` first, which refuses outright when `NODE_ENV` is
 * `production`. The guard is derived from the environment rather than from a
 * flag somebody could set in a deployment — the same construction
 * `next.config.ts` uses to keep `unsafe-eval` out of a production build.
 *
 * What that buys: the account pages are real and exercisable in development,
 * and a production deployment that has not yet been pointed at the API refuses
 * to sign anybody in rather than handing out sessions from a map that a
 * restart erases and a second instance never sees.
 *
 * The shape here is the shape `packages/database` already declares — customer,
 * address, session, OTP challenge — so replacing this file with Prisma queries
 * is a substitution and not a redesign. Nothing above it knows the difference:
 * the modules that read it take an owner and return a contract.
 *
 * One deliberate absence: there are no passwords, codes or tokens in plain
 * form anywhere in this file. It stores hashes, because the day it becomes a
 * database is the day it becomes something that can leak.
 */
import { randomUUID } from 'node:crypto';

import type {
  AddressLabel,
  CheckoutPayment,
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

import { getGoldRate } from '@/lib/gold-price';

import { newNumericCode } from './crypto';

export class AccountsUnavailableError extends Error {
  override readonly name = 'AccountsUnavailableError';
}

/**
 * True when accounts can be served at all.
 *
 * Read by the sign-in page so it can say so plainly, instead of every action
 * below it failing one at a time.
 */
export function accountsAvailable(): boolean {
  return process.env.NODE_ENV !== 'production';
}

export function assertAvailable(): void {
  if (!accountsAvailable()) {
    throw new AccountsUnavailableError('The account store is not configured');
  }
}

/* -------------------------------------------------------------------------- */
/* Records                                                                    */
/* -------------------------------------------------------------------------- */

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
}

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

export interface OrderRecord {
  readonly customerId: string;
  readonly code: string;
  readonly placedAt: string;
  readonly state: OrderState;
  readonly title: string;
  readonly totalRials: bigint;
  readonly productSlug: string | null;
  readonly itemCount: number;
}

/* -------------------------------------------------------------------------- */
/* Tables                                                                     */
/* -------------------------------------------------------------------------- */

interface Tables {
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

/**
 * The tables, hung off `globalThis`.
 *
 * A module-level `const` is not enough: the development server re-evaluates a
 * module when the file it belongs to changes, and every session in the map
 * would end at the next edit. Anchoring them outside the module graph keeps a
 * signed-in tab signed in across a reload.
 */
const TABLES_KEY = Symbol.for('sharghigold.account.tables');

interface GlobalWithTables {
  [TABLES_KEY]?: Tables;
}

function tables(): Tables {
  const holder = globalThis as GlobalWithTables;
  const existing = holder[TABLES_KEY];
  if (existing !== undefined) return existing;

  const created: Tables = {
    customers: new Map(),
    byMobile: new Map(),
    addresses: new Map(),
    sessions: new Map(),
    challenges: new Map(),
    orders: [],
    payments: new Map(),
    carts: new Map(),
    drafts: new Map(),
    placedOrders: new Map(),
    walletEntries: [],
  };
  holder[TABLES_KEY] = created;
  seed(created);
  return created;
}

/* -------------------------------------------------------------------------- */
/* Customers                                                                  */
/* -------------------------------------------------------------------------- */

export function findCustomerByMobile(mobile: string): CustomerRecord | undefined {
  assertAvailable();
  const id = tables().byMobile.get(mobile);
  return id === undefined ? undefined : tables().customers.get(id);
}

export function findCustomer(id: string): CustomerRecord | undefined {
  assertAvailable();
  return tables().customers.get(id);
}

/**
 * Find the account for a mobile number, creating it if there is none.
 *
 * Sign-in and sign-up are the same act here, which is what the design says
 * («اگر قبلاً ثبت‌نام کرده باشید وارد می‌شوید، در غیر این صورت حساب شما ساخته
 * می‌شود») and what makes the OTP response identical either way. A response
 * that differed would tell a stranger which numbers have accounts.
 */
export function upsertCustomer(mobile: string, now: Date): CustomerRecord {
  assertAvailable();

  const existing = findCustomerByMobile(mobile);
  if (existing !== undefined) return existing;

  const created: CustomerRecord = {
    id: randomUUID(),
    mobile,
    displayName: null,
    nationalId: null,
    birthDate: null,
    iban: null,
    kycStatus: 'none',
    kycRejectionReason: null,
    selfieChallenge: null,
    selfieSubmittedAt: null,
    passwordHash: null,
    joinedAt: now.toISOString(),
    walletRials: 0n,
    walletUpdatedAt: now.toISOString(),
    goldMilligrams: 0n,
    favouriteCount: 0,
    unreadMessageCount: 0,
  };

  tables().customers.set(created.id, created);
  tables().byMobile.set(mobile, created.id);
  return created;
}

/** Issue a fresh liveness challenge, replacing any outstanding one. */
export function issueSelfieChallenge(customer: CustomerRecord): string {
  const challenge = newNumericCode(5);
  customer.selfieChallenge = challenge;
  return challenge;
}

/* -------------------------------------------------------------------------- */
/* Addresses                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Every address belonging to one customer, default first.
 *
 * The owner is a parameter and never a filter the caller may skip: a listing
 * function that could be called without one is a listing of everybody's
 * addresses waiting to happen (rule 8).
 */
export function listAddresses(customerId: string): readonly AddressRecord[] {
  assertAvailable();
  return [...tables().addresses.values()]
    .filter((address) => address.customerId === customerId)
    .toSorted((left, right) => Number(right.isDefault) - Number(left.isDefault));
}

/** One address, only if it belongs to `customerId`. */
export function findAddress(customerId: string, id: string): AddressRecord | undefined {
  assertAvailable();
  const address = tables().addresses.get(id);
  return address !== undefined && address.customerId === customerId ? address : undefined;
}

export function saveAddress(address: AddressRecord): void {
  assertAvailable();
  if (address.isDefault) clearDefaults(address.customerId, address.id);
  tables().addresses.set(address.id, address);
  ensureOneDefault(address.customerId);
}

export function deleteAddress(customerId: string, id: string): boolean {
  assertAvailable();
  if (findAddress(customerId, id) === undefined) return false;
  tables().addresses.delete(id);
  ensureOneDefault(customerId);
  return true;
}

export function makeAddressDefault(customerId: string, id: string): boolean {
  assertAvailable();
  const address = findAddress(customerId, id);
  if (address === undefined) return false;
  clearDefaults(customerId, id);
  address.isDefault = true;
  return true;
}

function clearDefaults(customerId: string, except: string): void {
  for (const address of tables().addresses.values()) {
    if (address.customerId === customerId && address.id !== except) address.isDefault = false;
  }
}

/**
 * Keep exactly one address marked default while any exist.
 *
 * Deleting the default otherwise leaves checkout with nothing preselected, and
 * «no default» is a state the customer never chose.
 */
function ensureOneDefault(customerId: string): void {
  const owned = [...tables().addresses.values()].filter(
    (address) => address.customerId === customerId,
  );
  if (owned.length === 0 || owned.some((address) => address.isDefault)) return;
  const first = owned[0];
  if (first !== undefined) first.isDefault = true;
}

export function newAddressId(): string {
  return randomUUID();
}

/* -------------------------------------------------------------------------- */
/* Orders                                                                     */
/* -------------------------------------------------------------------------- */

export function listOrders(customerId: string): readonly OrderRecord[] {
  assertAvailable();
  return tables()
    .orders.filter((order) => order.customerId === customerId)
    .toSorted((left, right) => Date.parse(right.placedAt) - Date.parse(left.placedAt));
}

/* -------------------------------------------------------------------------- */
/* Payments                                                                   */
/* -------------------------------------------------------------------------- */

export function insertPayment(record: PaymentRecord): PaymentRecord {
  assertAvailable();
  tables().payments.set(record.id, record);
  return record;
}

/**
 * One payment, scoped to its owner.
 *
 * The customer id is a parameter rather than a filter applied afterwards, so
 * there is no way to call this and forget it. A payment belonging to somebody
 * else is `undefined` — the same answer as one that does not exist.
 */
export function findPayment(customerId: string, id: string): PaymentRecord | undefined {
  assertAvailable();
  const found = tables().payments.get(id);
  return found?.customerId === customerId ? found : undefined;
}

export function listPayments(customerId: string): readonly PaymentRecord[] {
  assertAvailable();
  return [...tables().payments.values()]
    .filter((payment) => payment.customerId === customerId)
    .toSorted((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
}

/**
 * Move a payment to a terminal state, crediting the wallet if it succeeded.
 *
 * The status change and the credit happen together, in one synchronous pass
 * that nothing can interleave with, because the alternative is a wallet that
 * has been credited for a payment still marked pending — or credited twice.
 * When the database replaces this file the same pass becomes one transaction
 * with the payment row locked; the shape is chosen so that substitution is all
 * it takes.
 *
 * Returns false when the payment was already settled. That is not a failure:
 * it is what makes calling this twice safe, which it has to be, because a
 * customer who refreshes the bank's return page calls it twice.
 */
export function settlePayment(payment: PaymentRecord, status: PaymentStatus, now: Date): boolean {
  assertAvailable();

  if (payment.status !== 'pending') return false;

  const customer = tables().customers.get(payment.customerId);
  if (customer === undefined) return false;

  if (status === 'succeeded') {
    customer.walletRials += payment.amountRials;
    customer.walletUpdatedAt = now.toISOString();
    payment.balanceAfterRials = customer.walletRials;

    // In the same pass as the balance change, for the same reason the debit
    // is: a ledger written afterwards is a ledger that can be skipped.
    appendWalletEntry({
      customerId: payment.customerId,
      at: now.toISOString(),
      amountRials: payment.amountRials,
      balanceAfterRials: customer.walletRials,
      kind: 'top-up',
      label: 'افزایش موجودی کیف پول',
      reference: payment.reference,
    });
  }

  payment.status = status;
  payment.settledAt = now.toISOString();
  return true;
}

export function newPaymentId(): string {
  return randomUUID();
}

/* -------------------------------------------------------------------------- */
/* Wallet                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Take money out of the wallet, or take none of it.
 *
 * The balance check and the deduction happen in one synchronous pass, for the
 * same reason `settlePayment` does: a check and a write with anything between
 * them is a balance two requests can both pass and both spend. When the
 * database replaces this, the pass becomes one transaction with the row
 * locked.
 *
 * Returns false when there is not enough. A negative wallet is not a state
 * this shop has, so it is refused rather than allowed and reported.
 */
export function debitWallet(
  customerId: string,
  amountRials: bigint,
  now: Date,
  entry: { readonly label: string; readonly reference: string | null } = {
    label: 'پرداخت سفارش',
    reference: null,
  },
): boolean {
  assertAvailable();

  if (amountRials < 0n) return false;

  const customer = tables().customers.get(customerId);
  if (customer === undefined) return false;
  if (customer.walletRials < amountRials) return false;

  customer.walletRials -= amountRials;
  customer.walletUpdatedAt = now.toISOString();

  // Written in the same pass as the balance change, never afterwards: a
  // ledger that can be skipped is a ledger that disagrees with the balance.
  if (amountRials > 0n) {
    appendWalletEntry({
      customerId,
      at: now.toISOString(),
      amountRials: -amountRials,
      balanceAfterRials: customer.walletRials,
      kind: 'order',
      label: entry.label,
      reference: entry.reference,
    });
  }

  return true;
}

/** Put money back, when the payment it was taken for did not happen. */
export function creditWallet(
  customerId: string,
  amountRials: bigint,
  now: Date,
  entry: {
    readonly kind: WalletEntryRecord['kind'];
    readonly label: string;
    readonly reference: string | null;
  } = {
    kind: 'refund',
    label: 'بازگشت وجه سفارش',
    reference: null,
  },
): void {
  assertAvailable();
  if (amountRials <= 0n) return;

  const customer = tables().customers.get(customerId);
  if (customer === undefined) return;

  customer.walletRials += amountRials;
  customer.walletUpdatedAt = now.toISOString();

  appendWalletEntry({
    customerId,
    at: now.toISOString(),
    amountRials,
    balanceAfterRials: customer.walletRials,
    kind: entry.kind,
    label: entry.label,
    reference: entry.reference,
  });
}

/* -------------------------------------------------------------------------- */
/* The wallet ledger                                                          */
/* -------------------------------------------------------------------------- */

function appendWalletEntry(entry: Omit<WalletEntryRecord, 'id'>): void {
  tables().walletEntries.push({ id: randomUUID(), ...entry });
}

/**
 * A customer's wallet movements, newest first.
 *
 * Filtered by customer inside the store, so no caller can ask for somebody
 * else's — there is no id to pass and therefore no id to get wrong.
 */
export function listWalletEntries(customerId: string): readonly WalletEntryRecord[] {
  assertAvailable();
  return tables()
    .walletEntries.filter((entry) => entry.customerId === customerId)
    .toSorted((left, right) => Date.parse(right.at) - Date.parse(left.at));
}

/* -------------------------------------------------------------------------- */
/* Baskets                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * The customer's basket, created empty the first time it is asked for.
 *
 * Keyed by customer, so there is no id to pass and therefore no id to get
 * wrong. A basket belongs to exactly one account and cannot be addressed from
 * outside it.
 */
export function getOrCreateCart(customerId: string, rate: bigint, now: Date): CartRecord {
  assertAvailable();

  const existing = tables().carts.get(customerId);
  if (existing !== undefined) return existing;

  const created: CartRecord = {
    customerId,
    lines: [],
    saved: [],
    discountCode: null,
    ratePerGramRials: rate,
    rateQuotedAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  tables().carts.set(customerId, created);
  return created;
}

export function findCart(customerId: string): CartRecord | undefined {
  assertAvailable();
  return tables().carts.get(customerId);
}

export function touchCart(cart: CartRecord, now: Date): void {
  cart.updatedAt = now.toISOString();
}

/** Empty a basket, keeping the record so its price lock stays where it was. */
export function clearCart(customerId: string, now: Date): void {
  assertAvailable();
  const cart = tables().carts.get(customerId);
  if (cart === undefined) return;

  cart.lines = [];
  cart.discountCode = null;
  cart.updatedAt = now.toISOString();
}

export function newCartLineId(): string {
  return randomUUID();
}

/* -------------------------------------------------------------------------- */
/* The checkout draft                                                         */
/* -------------------------------------------------------------------------- */

/** The draft, created with the shop's defaults the first time it is needed. */
export function getOrCreateDraft(customerId: string, now: Date): CheckoutDraftRecord {
  assertAvailable();

  const existing = tables().drafts.get(customerId);
  if (existing !== undefined) return existing;

  const created: CheckoutDraftRecord = {
    customerId,
    mode: 'ship',
    addressId: null,
    shipping: 'post',
    branchId: 'grand-bazaar',
    slotId: null,
    gift: false,
    recipientName: null,
    recipientMobile: null,
    notes: '',
    payment: 'gateway',
    installmentMonths: 12,
    invoice: 'personal',
    companyName: null,
    companyCode: null,
    termsAcceptedAt: null,
    intent: null,
    spentIntent: null,
    placedCode: null,
    simulate: null,
    updatedAt: now.toISOString(),
  };

  tables().drafts.set(customerId, created);
  return created;
}

/**
 * Retire the draft once the order it described exists.
 *
 * The record is kept rather than deleted, for one reason: a customer who taps
 * «pay» twice has to be shown the order they already placed, and a deleted
 * draft has nothing to show them. What is cleared is everything that must not
 * be inherited by a second order — the acceptance of the terms, the collection
 * slot, the note and the wrapping. The address and the payment preference stay,
 * because those are the same next time and asking again is not care, it is
 * friction.
 */
export function retireDraft(customerId: string, code: string, now: Date): void {
  assertAvailable();

  const draft = tables().drafts.get(customerId);
  if (draft === undefined) return;

  draft.placedCode = code;
  draft.termsAcceptedAt = null;
  draft.slotId = null;
  draft.notes = '';
  draft.gift = false;
  draft.simulate = null;
  draft.updatedAt = now.toISOString();
}

/* -------------------------------------------------------------------------- */
/* Placed orders                                                              */
/* -------------------------------------------------------------------------- */

export function insertOrderSnapshot(record: OrderSnapshotRecord): OrderSnapshotRecord {
  assertAvailable();
  tables().placedOrders.set(record.code, record);
  return record;
}

/** One order, scoped to its owner. Somebody else's is `undefined`. */
export function findOrderSnapshot(
  customerId: string,
  code: string,
): OrderSnapshotRecord | undefined {
  assertAvailable();
  const found = tables().placedOrders.get(code);
  return found?.customerId === customerId ? found : undefined;
}

/**
 * A code no order already has.
 *
 * Random rather than sequential: a sequential order number tells every
 * customer how many orders the shop takes, and makes the next one guessable —
 * which matters because a code is what a support call is keyed on. Ownership
 * is still checked on every read; this only stops the guessing being free.
 */
/**
 * Add a placed order to the customer's own list.
 *
 * Only paid orders reach it. An order whose payment failed is still readable
 * by its code — the result screen needs it — but it is not history, and a
 * failed charge sitting in «سفارش‌های من» is a customer ringing to ask what
 * they have been billed for.
 */
export function pushOrderRow(record: OrderRecord): void {
  assertAvailable();
  tables().orders.push(record);
}

export function newOrderCode(): string {
  assertAvailable();
  const taken = tables().placedOrders;

  for (let attempt = 0; attempt < 50; attempt += 1) {
    const code = `ZN-${newNumericCode(5)}`;
    if (!taken.has(code)) return code;
  }

  throw new Error('could not allocate an order code');
}

/* -------------------------------------------------------------------------- */
/* Sessions                                                                   */
/* -------------------------------------------------------------------------- */

export function insertSession(record: SessionRecord): SessionRecord {
  assertAvailable();
  tables().sessions.set(record.tokenHash, record);
  return record;
}

export function findSessionByTokenHash(tokenHash: string): SessionRecord | undefined {
  assertAvailable();
  return tables().sessions.get(tokenHash);
}

export function listSessions(customerId: string): readonly SessionRecord[] {
  assertAvailable();
  const now = Date.now();
  return [...tables().sessions.values()]
    .filter(
      (session) =>
        session.customerId === customerId &&
        session.revokedAt === null &&
        Date.parse(session.expiresAt) > now,
    )
    .toSorted((left, right) => Date.parse(right.lastSeenAt) - Date.parse(left.lastSeenAt));
}

export function findSession(customerId: string, id: string): SessionRecord | undefined {
  assertAvailable();
  return listSessions(customerId).find((session) => session.id === id);
}

export function revokeSession(session: SessionRecord, now: Date): void {
  session.revokedAt = now.toISOString();
}

/** Sign out every session except one. The one kept is the caller's own. */
export function revokeOtherSessions(customerId: string, keepTokenHash: string, now: Date): number {
  assertAvailable();
  let revoked = 0;
  for (const session of tables().sessions.values()) {
    if (session.customerId !== customerId) continue;
    if (session.tokenHash === keepTokenHash || session.revokedAt !== null) continue;
    session.revokedAt = now.toISOString();
    revoked += 1;
  }
  return revoked;
}

export function newSessionId(): string {
  return randomUUID();
}

/* -------------------------------------------------------------------------- */
/* One-time codes                                                             */
/* -------------------------------------------------------------------------- */

export function putChallenge(record: OtpRecord): void {
  assertAvailable();
  tables().challenges.set(record.mobile, record);
}

export function findChallenge(mobile: string): OtpRecord | undefined {
  assertAvailable();
  return tables().challenges.get(mobile);
}

export function dropChallenge(mobile: string): void {
  tables().challenges.delete(mobile);
}

/* -------------------------------------------------------------------------- */
/* Development seed                                                           */
/* -------------------------------------------------------------------------- */

/** The number the design is drawn around, and the only account with history. */
export const DEMO_MOBILE = '09120001234';

/**
 * Populate one account so the pages have something to draw.
 *
 * Only this number gets a wallet, orders, addresses and a rejected
 * verification. Signing in with any other creates an empty account — which is
 * not an oversight but the point: the empty wallet, the address list with
 * nothing in it and the unstarted verification are states the design draws and
 * a shop has to get right.
 */
function seed(store: Tables): void {
  if (!accountsAvailable()) return;

  const joinedAt = '2026-03-04T09:12:00.000Z';
  const customer: CustomerRecord = {
    id: '01997d1a-4c8e-7a31-9f60-2b5c7d0e41aa',
    mobile: DEMO_MOBILE,
    displayName: null,
    nationalId: null,
    birthDate: null,
    iban: null,
    kycStatus: 'rejected',
    kycRejectionReason: 'تصویر ارسالی خوانا نبود. لطفاً در نور کافی و بدون عینک دوباره ارسال کنید.',
    selfieChallenge: null,
    selfieSubmittedAt: null,
    passwordHash: null,
    joinedAt,
    // ۴٬۸۲۰٬۰۰۰ تومان, held as the rials it actually is.
    walletRials: 48_200_000n,
    walletUpdatedAt: '2026-09-08T18:40:00.000Z',
    goldMilligrams: 3_200n,
    favouriteCount: 7,
    unreadMessageCount: 1,
  };

  store.customers.set(customer.id, customer);
  store.byMobile.set(customer.mobile, customer.id);

  const addresses: readonly AddressRecord[] = [
    {
      id: '01997d1a-4c8e-7a31-9f60-2b5c7d0e41b1',
      customerId: customer.id,
      label: 'home',
      recipientName: 'کاربر زرنما',
      recipientMobile: DEMO_MOBILE,
      province: 'تهران',
      city: 'تهران',
      line: 'سعادت‌آباد، خیابان علامه شمالی، کوچه ۱۸',
      plate: '۷',
      unit: '۴',
      postalCode: '1997845613',
      isDefault: true,
    },
    {
      id: '01997d1a-4c8e-7a31-9f60-2b5c7d0e41b2',
      customerId: customer.id,
      label: 'work',
      recipientName: 'کاربر زرنما',
      recipientMobile: DEMO_MOBILE,
      province: 'تهران',
      city: 'تهران',
      line: 'بازار بزرگ، سرای طلا، طبقه دوم',
      plate: '۱۴',
      unit: null,
      postalCode: '1194733109',
      isDefault: false,
    },
  ];

  for (const address of addresses) store.addresses.set(address.id, address);

  store.orders.push(
    {
      customerId: customer.id,
      code: 'ZN-88412',
      placedAt: '2026-08-12T11:20:00.000Z',
      state: 'processing',
      title: 'انگشتر طلا ۱۸ عیار تک‌نگین کلاسیک',
      totalRials: 324_600_000n,
      productSlug: 'classic-solitaire-ring',
      itemCount: 1,
    },
    {
      customerId: customer.id,
      code: 'ZN-87204',
      placedAt: '2026-07-31T07:05:00.000Z',
      state: 'delivered',
      title: 'گوشواره حلقه‌ای پیچ ۱۸ عیار',
      totalRials: 268_000_000n,
      productSlug: null,
      itemCount: 1,
    },
    {
      customerId: customer.id,
      code: 'ZN-85991',
      placedAt: '2026-07-18T15:44:00.000Z',
      state: 'cancelled',
      title: 'نیم‌ست قلب رزگلد',
      totalRials: 538_000_000n,
      productSlug: null,
      itemCount: 2,
    },
  );

  // Two devices that signed in earlier, so «دستگاه‌های فعال» has something to
  // list before the current one is added to it.
  const past: readonly SessionRecord[] = [
    {
      id: '01997d1a-4c8e-7a31-9f60-2b5c7d0e41c1',
      customerId: customer.id,
      tokenHash: 'seed-desktop',
      createdAt: '2026-09-07T09:00:00.000Z',
      lastSeenAt: '2026-09-07T09:40:00.000Z',
      expiresAt: '2026-11-07T09:00:00.000Z',
      revokedAt: null,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/140.0',
      place: 'تهران',
    },
    {
      id: '01997d1a-4c8e-7a31-9f60-2b5c7d0e41c2',
      customerId: customer.id,
      tokenHash: 'seed-app',
      createdAt: '2026-08-27T19:12:00.000Z',
      lastSeenAt: '2026-08-27T19:30:00.000Z',
      expiresAt: '2026-10-27T19:12:00.000Z',
      revokedAt: null,
      userAgent: 'Zarnama/1.4 (Android 15)',
      place: 'کرج',
    },
  ];

  for (const session of past) store.sessions.set(session.tokenHash, session);

  // A basket with something in it, so the cart screens have the states the
  // design draws: a line whose stock is nearly gone, a line with more than one
  // of it, and a saved piece that can no longer be ordered.
  const basketAt = '2026-09-10T17:05:00.000Z';
  const line = (id: string, productSlug: string, size: number | null, quantity: number) => ({
    id,
    productSlug,
    size,
    colour: 'yellow' as const,
    quantity,
    addedAt: basketAt,
  });

  store.carts.set(customer.id, {
    customerId: customer.id,
    lines: [
      line('01997d1a-4c8e-7a31-9f60-2b5c7d0e4201', 'classic-solitaire-ring', 54, 1),
      line('01997d1a-4c8e-7a31-9f60-2b5c7d0e4202', 'delicate-band-ring', 56, 2),
      line('01997d1a-4c8e-7a31-9f60-2b5c7d0e4203', 'stone-set-dress-ring', 56, 1),
    ],
    saved: [
      line('01997d1a-4c8e-7a31-9f60-2b5c7d0e4211', 'paired-wedding-bands', 58, 1),
      line('01997d1a-4c8e-7a31-9f60-2b5c7d0e4212', 'rose-gold-solitaire-ring', 54, 1),
    ],
    discountCode: null,
    ratePerGramRials: getGoldRate().pricePerGram18k,
    // Struck when the tables were built, so the lock counts down from a full
    // window on a fresh development server rather than from an expired one.
    rateQuotedAt: new Date().toISOString(),
    updatedAt: basketAt,
  });
}

/** Throw the tables away. For tests, which must not share state. */
export function resetAccountStore(): void {
  const holder = globalThis as GlobalWithTables;
  delete holder[TABLES_KEY];
}
