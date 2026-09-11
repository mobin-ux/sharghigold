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
  KycStatus,
  OrderState,
  PaymentMethod,
  PaymentStatus,
} from '@sharghigold/contracts';

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
  }

  payment.status = status;
  payment.settledAt = now.toISOString();
  return true;
}

export function newPaymentId(): string {
  return randomUUID();
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
}

/** Throw the tables away. For tests, which must not share state. */
export function resetAccountStore(): void {
  const holder = globalThis as GlobalWithTables;
  delete holder[TABLES_KEY];
}
