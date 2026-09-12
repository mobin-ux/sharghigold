/**
 * Where account records live while there is no database behind them.
 *
 * Server-only and **development-only** — see `availability.ts`. One module per
 * table, each a stand-in for the Prisma repository that replaces it:
 *
 *   records.ts          row types, and the `Tables` shape
 *   tables.ts           the tables, anchored on `globalThis`; test reset
 *   seed.ts             the demo account the pages are drawn around
 *   customers.ts        addresses.ts   sessions.ts   otp.ts
 *   carts.ts            checkout-drafts.ts
 *   orders.ts           payments.ts    wallet.ts (balance + ledger)
 *
 * Import from `@/server/account/store`, never from a file inside it: this index
 * is the seam that becomes the database client, and it deliberately does not
 * export the raw tables or the ledger writer.
 */
export { AccountsUnavailableError, accountsAvailable, assertAvailable } from './availability';
export type {
  AddressRecord,
  CartLineRecord,
  CartRecord,
  CheckoutDraftRecord,
  CustomerRecord,
  OrderRecord,
  OrderSnapshotRecord,
  OtpRecord,
  PaymentRecord,
  SessionRecord,
  WalletEntryRecord,
} from './records';
export { resetAccountStore } from './tables';
export { DEMO_MOBILE } from './seed';
export {
  findCustomer,
  findCustomerByMobile,
  issueSelfieChallenge,
  upsertCustomer,
} from './customers';
export {
  deleteAddress,
  findAddress,
  listAddresses,
  makeAddressDefault,
  newAddressId,
  saveAddress,
} from './addresses';
export {
  findOrderSnapshot,
  insertOrderSnapshot,
  listOrders,
  newOrderCode,
  pushOrderRow,
} from './orders';
export { findPayment, insertPayment, listPayments, newPaymentId, settlePayment } from './payments';
export { creditWallet, debitWallet, listWalletEntries } from './wallet';
export { clearCart, findCart, getOrCreateCart, newCartLineId, touchCart } from './carts';
export { getOrCreateDraft, retireDraft } from './checkout-drafts';
export {
  findSession,
  findSessionByTokenHash,
  insertSession,
  listSessions,
  newSessionId,
  revokeOtherSessions,
  revokeSession,
} from './sessions';
export { dropChallenge, findChallenge, putChallenge } from './otp';
