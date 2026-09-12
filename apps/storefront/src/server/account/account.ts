/**
 * The account gateway: records in, contracts out.
 *
 * Server-only. Every function here takes a `Viewer` as its first argument and
 * scopes what it reads and writes to that viewer's own id. Nothing takes an
 * owner as data, and nothing accepts one from a caller — an id in a URL is
 * looked up *within* the viewer's rows, so a request for somebody else's
 * address is indistinguishable from a request for one that does not exist
 * (rule 8). That is why `getAddress` returns `undefined` rather than throwing
 * a «forbidden»: a 404 and a 403 together are a membership oracle.
 *
 * Everything crossing out of this file is parsed against the shared contract
 * before it leaves. That looks redundant — the data came from inside — and it
 * is exactly the check that catches a store change that quietly widens what a
 * page receives.
 */
import {
  accountOrderDetailSchema,
  accountOrderSchema,
  accountOverviewSchema,
  accountProfileSchema,
  addressSchema,
  deviceSessionSchema,
  type AccountOrder,
  type AccountOrderDetail,
  type AccountOverview,
  type AccountProfile,
  type ActiveOrder,
  type Address,
  type AddressDraft,
  type DeviceKind,
  type DeviceSession,
  type KycProgress,
  type OrderFilter,
  type OrderState,
  type ProfileUpdateInput,
} from '@sharghigold/contracts';

import { isKnownRegion } from '@/data/iran-regions';

import { hashPassword } from './crypto';
import type { Viewer } from './session';
import {
  deleteAddress,
  findAddress,
  findOrderSnapshot,
  issueSelfieChallenge,
  listAddresses,
  listOrders,
  listSessions,
  makeAddressDefault,
  newAddressId,
  saveAddress,
  type AddressRecord,
  type CustomerRecord,
  type OrderRecord,
  type SessionRecord,
} from './store';

export class ContractError extends Error {
  override readonly name = 'ContractError';
}

function parsed<T>(result: { success: true; data: T } | { success: false }, what: string): T {
  if (!result.success) throw new ContractError(`${what} does not satisfy its contract`);
  return result.data;
}

/* -------------------------------------------------------------------------- */
/* Identity verification                                                      */
/* -------------------------------------------------------------------------- */

/**
 * How far verification has got, derived from what is on file.
 *
 * Derived rather than stored, so a step cannot be marked done without the
 * value that makes it done actually being there.
 */
function progressOf(customer: CustomerRecord): KycProgress {
  const identity = customer.nationalId !== null && customer.birthDate !== null;
  const bank = customer.iban !== null;
  const selfie = customer.selfieSubmittedAt !== null;

  return {
    status: customer.kycStatus,
    steps: [
      { key: 'identity', done: identity },
      { key: 'bank', done: bank },
      { key: 'selfie', done: selfie },
    ],
    rejectionReason: customer.kycStatus === 'rejected' ? customer.kycRejectionReason : null,
    selfieChallenge: customer.selfieChallenge,
  };
}

/** The last four digits, with the rest withheld. */
function mask(nationalId: string): string {
  return `${'*'.repeat(6)}${nationalId.slice(6)}`;
}

/* -------------------------------------------------------------------------- */
/* Profile                                                                    */
/* -------------------------------------------------------------------------- */

export function toProfile(customer: CustomerRecord): AccountProfile {
  const verified = customer.kycStatus === 'verified';

  return parsed(
    accountProfileSchema.safeParse({
      id: customer.id,
      mobile: customer.mobile,
      displayName: customer.displayName,
      // Withheld once a bank has matched it: from that point it is the key to
      // a credit profile rather than a field on a form.
      nationalId: verified ? null : customer.nationalId,
      nationalIdMasked:
        customer.nationalId === null || !verified ? null : mask(customer.nationalId),
      hasPassword: customer.passwordHash !== null,
      kyc: progressOf(customer),
      joinedAt: customer.joinedAt,
    }),
    'profile',
  );
}

export function getProfile(viewer: Viewer): AccountProfile {
  return toProfile(viewer.customer);
}

export type ProfileWriteResult = { readonly status: 'saved' } | { readonly status: 'locked' };

/**
 * Apply a parsed profile update.
 *
 * A verified national ID is refused rather than ignored. Silently dropping the
 * field would tell the customer their change was saved when it was not.
 */
export function updateProfile(viewer: Viewer, update: ProfileUpdateInput): ProfileWriteResult {
  const { customer } = viewer;

  if (
    customer.kycStatus === 'verified' &&
    update.nationalId !== null &&
    update.nationalId !== customer.nationalId
  ) {
    return { status: 'locked' };
  }

  customer.displayName = update.displayName;
  if (customer.kycStatus !== 'verified') customer.nationalId = update.nationalId;

  return { status: 'saved' };
}

export async function setPassword(viewer: Viewer, password: string): Promise<void> {
  viewer.customer.passwordHash = await hashPassword(password);
}

/* -------------------------------------------------------------------------- */
/* The account home                                                           */
/* -------------------------------------------------------------------------- */

/** Which of the four progress dots an order is standing on. */
const ORDER_STEP: Record<OrderState, number> = {
  processing: 1,
  shipped: 2,
  delivered: 3,
  cancelled: 0,
};

function activeOrderOf(orders: readonly OrderRecord[]): ActiveOrder | null {
  const open = orders.find((order) => order.state === 'processing' || order.state === 'shipped');

  return open === undefined ? null : { code: open.code, step: ORDER_STEP[open.state] };
}

export function getOverview(viewer: Viewer): AccountOverview {
  const { customer } = viewer;
  const orders = listOrders(customer.id);

  return parsed(
    accountOverviewSchema.safeParse({
      profile: toProfile(customer),
      wallet: {
        balanceRials: customer.walletRials.toString(),
        updatedAt: customer.walletUpdatedAt,
      },
      activeOrder: activeOrderOf(orders),
      // Counted from the rows, not stored. A badge that disagrees with the
      // list under it is worse than no badge.
      orderCount: orders.length,
      addressCount: listAddresses(customer.id).length,
      favouriteCount: customer.favouriteCount,
      unreadMessageCount: customer.unreadMessageCount,
      goldMilligrams: customer.goldMilligrams.toString(),
    }),
    'account overview',
  );
}

/* -------------------------------------------------------------------------- */
/* Orders                                                                     */
/* -------------------------------------------------------------------------- */

const MATCHES: Record<OrderFilter, (order: OrderRecord) => boolean> = {
  all: () => true,
  open: (order) => order.state === 'processing' || order.state === 'shipped',
  delivered: (order) => order.state === 'delivered',
  cancelled: (order) => order.state === 'cancelled',
};

export interface OrderList {
  readonly orders: readonly AccountOrder[];
  /** How many the filter kept, and how many exist at all. */
  readonly matched: number;
  readonly total: number;
}

/**
 * The customer's orders, filtered on the server.
 *
 * The filter arrives from the query string and has already been parsed into a
 * closed set, so nothing attacker-chosen reaches this lookup.
 */
export function getOrders(viewer: Viewer, filter: OrderFilter): OrderList {
  const all = listOrders(viewer.customer.id);
  const kept = all.filter(MATCHES[filter]);

  return {
    orders: kept.map((order) =>
      parsed(
        accountOrderSchema.safeParse({
          code: order.code,
          placedAt: order.placedAt,
          state: order.state,
          title: order.title,
          totalRials: order.totalRials.toString(),
          productSlug: order.productSlug,
          itemCount: order.itemCount,
        }),
        'order',
      ),
    ),
    matched: kept.length,
    total: all.length,
  };
}

/**
 * One order, or nothing.
 *
 * `code` comes from the URL, so it is arbitrary text chosen by whoever
 * followed the link. It is matched only against rows belonging to this viewer,
 * and an order belonging to somebody else returns undefined — the same answer
 * as an order that does not exist. Answering «forbidden» for one and «not
 * found» for the other would confirm which order codes are real, which is the
 * whole of the attack (rule 20).
 *
 * The payment detail comes from the checkout snapshot when there is one.
 * Orders that predate checkout have a state and a total and nothing else, and
 * every added field is null for them rather than invented.
 */
export function findOrder(viewer: Viewer, code: string): AccountOrderDetail | undefined {
  const order = listOrders(viewer.customer.id).find((row) => row.code === code);

  if (order === undefined) return undefined;

  const snapshot = findOrderSnapshot(viewer.customer.id, code);

  return parsed(
    accountOrderDetailSchema.safeParse({
      code: order.code,
      placedAt: order.placedAt,
      state: order.state,
      title: order.title,
      totalRials: order.totalRials.toString(),
      productSlug: order.productSlug,
      itemCount: order.itemCount,
      paymentState: snapshot?.paymentState ?? null,
      paymentLabel: snapshot?.paymentLabel ?? null,
      paidRials: snapshot === undefined ? null : snapshot.paidRials.toString(),
      deliveryLabel: snapshot?.deliveryLabel ?? null,
      reference: snapshot?.reference ?? null,
      failureReason: snapshot?.failureReason ?? null,
      settledAt: snapshot?.settledAt ?? null,
    }),
    'order detail',
  );
}

/* -------------------------------------------------------------------------- */
/* Addresses                                                                  */
/* -------------------------------------------------------------------------- */

function toAddress(record: AddressRecord): Address {
  return parsed(
    addressSchema.safeParse({
      id: record.id,
      label: record.label,
      recipientName: record.recipientName,
      recipientMobile: record.recipientMobile,
      province: record.province,
      city: record.city,
      line: record.line,
      plate: record.plate,
      unit: record.unit,
      postalCode: record.postalCode,
      isDefault: record.isDefault,
    }),
    'address',
  );
}

export function getAddresses(viewer: Viewer): readonly Address[] {
  return listAddresses(viewer.customer.id).map(toAddress);
}

export function getAddress(viewer: Viewer, id: string): Address | undefined {
  const record = findAddress(viewer.customer.id, id);
  return record === undefined ? undefined : toAddress(record);
}

export type AddressWriteResult =
  | { readonly status: 'saved'; readonly id: string }
  /** The province and city do not go together, or the province is unknown. */
  | { readonly status: 'unknown-region' }
  | { readonly status: 'not-found' };

/**
 * Create or replace an address.
 *
 * `id` is the address being edited, and it is resolved against the viewer's
 * own rows before anything is written. An id that names somebody else's
 * address is `not-found`, which is the same answer as an id that names
 * nothing.
 *
 * When the recipient is the account holder the name and number are taken from
 * the profile rather than from the form. A recipient the customer never typed
 * cannot be wrong, and cannot be somebody else's number attached to a parcel.
 */
export function writeAddress(viewer: Viewer, draft: AddressDraft, id?: string): AddressWriteResult {
  if (!isKnownRegion(draft.province, draft.city)) return { status: 'unknown-region' };

  const existing = id === undefined ? undefined : findAddress(viewer.customer.id, id);
  if (id !== undefined && existing === undefined) return { status: 'not-found' };

  const { customer } = viewer;
  const recipientName = draft.deliverToSelf
    ? (customer.displayName ?? 'خودم')
    : draft.recipientName;
  const recipientMobile = draft.deliverToSelf ? customer.mobile : draft.recipientMobile;

  const record: AddressRecord = {
    id: existing?.id ?? newAddressId(),
    customerId: customer.id,
    label: draft.label,
    recipientName,
    recipientMobile,
    province: draft.province,
    city: draft.city,
    line: draft.line,
    plate: draft.plate,
    unit: draft.unit,
    postalCode: draft.postalCode,
    // The first address a customer saves is their default whatever the switch
    // says: an address list with nothing preselected is a checkout that cannot
    // start.
    isDefault: draft.isDefault || listAddresses(customer.id).length === 0,
  };

  saveAddress(record);
  return { status: 'saved', id: record.id };
}

export function removeAddress(viewer: Viewer, id: string): boolean {
  return deleteAddress(viewer.customer.id, id);
}

export function chooseDefaultAddress(viewer: Viewer, id: string): boolean {
  return makeAddressDefault(viewer.customer.id, id);
}

/* -------------------------------------------------------------------------- */
/* Verification steps                                                         */
/* -------------------------------------------------------------------------- */

export function saveIdentityStep(viewer: Viewer, nationalId: string, birthDate: string): void {
  viewer.customer.nationalId = nationalId;
  viewer.customer.birthDate = birthDate;
}

export function saveBankStep(viewer: Viewer, iban: string): void {
  viewer.customer.iban = iban;
}

/**
 * Issue the digits the customer writes on paper.
 *
 * Called when the selfie step is opened, so every attempt gets its own. A
 * fixed code — which is what the design draws — is a photograph that can be
 * taken once and reused forever, which is the one thing a liveness check must
 * not allow.
 */
export function selfieChallengeFor(viewer: Viewer): string {
  const existing = viewer.customer.selfieChallenge;
  return existing ?? issueSelfieChallenge(viewer.customer);
}

export type SelfieResult = { readonly status: 'submitted' } | { readonly status: 'stale' };

/**
 * Accept the last step and put the account into review.
 *
 * The challenge the form sends back is compared against the one on file. It is
 * not a secret, so this is not an authentication check — it is what stops a
 * form submitted from a stale tab being counted against a code that has since
 * been reissued.
 */
export function submitSelfieStep(viewer: Viewer, challenge: string, now: Date): SelfieResult {
  const { customer } = viewer;

  if (customer.selfieChallenge === null || customer.selfieChallenge !== challenge) {
    return { status: 'stale' };
  }

  customer.selfieSubmittedAt = now.toISOString();
  customer.selfieChallenge = null;
  customer.kycStatus = 'pending';
  customer.kycRejectionReason = null;

  return { status: 'submitted' };
}

/** Clear a refusal so the steps can be worked through again. */
export function restartVerification(viewer: Viewer): void {
  const { customer } = viewer;
  if (customer.kycStatus !== 'rejected' && customer.kycStatus !== 'none') return;
  customer.selfieSubmittedAt = null;
}

/* -------------------------------------------------------------------------- */
/* Devices                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Name a device from its user agent.
 *
 * Reduced to a platform and a browser, and nothing else. The raw string is a
 * fingerprint and a place to hide markup; what reaches the page is two words
 * chosen from a fixed list.
 */
export function describeDevice(userAgent: string | null): {
  readonly kind: DeviceKind;
  readonly name: string;
} {
  const agent = userAgent ?? '';

  if (/Zarnama\//.test(agent)) {
    return { kind: 'app', name: /Android/.test(agent) ? 'اپلیکیشن اندروید' : 'اپلیکیشن آیفون' };
  }

  const platform = /iPhone|iPad|iPod/.test(agent)
    ? 'آیفون'
    : /Android/.test(agent)
      ? 'اندروید'
      : /Windows/.test(agent)
        ? 'ویندوز'
        : /Mac OS X|Macintosh/.test(agent)
          ? 'مک'
          : /Linux/.test(agent)
            ? 'لینوکس'
            : 'دستگاه ناشناس';

  const browser = /Edg\//.test(agent)
    ? 'اج'
    : /OPR\/|Opera/.test(agent)
      ? 'اپرا'
      : /Firefox\//.test(agent)
        ? 'فایرفاکس'
        : /Chrome\/|CriOS/.test(agent)
          ? 'کروم'
          : /Safari\//.test(agent)
            ? 'سافاری'
            : 'مرورگر';

  const mobile = /iPhone|iPad|iPod|Android/.test(agent);

  return { kind: mobile ? 'phone' : 'desktop', name: `${platform} — ${browser}` };
}

function toDevice(record: SessionRecord, currentId: string): DeviceSession {
  const { kind, name } = describeDevice(record.userAgent);

  return parsed(
    deviceSessionSchema.safeParse({
      id: record.id,
      kind,
      name,
      place: record.place,
      lastSeenAt: record.lastSeenAt,
      isCurrent: record.id === currentId,
    }),
    'device',
  );
}

/**
 * Every device holding a live session, this one first.
 *
 * The current session leads the list and has no «sign out» button of its own:
 * ending it from here is the logout button, and offering the same act twice
 * under two names is how somebody signs themselves out by accident.
 */
export function getDevices(viewer: Viewer): readonly DeviceSession[] {
  return listSessions(viewer.customer.id)
    .map((session) => toDevice(session, viewer.session.id))
    .toSorted((left, right) => Number(right.isCurrent) - Number(left.isCurrent));
}
