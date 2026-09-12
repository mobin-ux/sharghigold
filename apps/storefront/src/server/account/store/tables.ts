import type { Tables } from './records';
import { seed } from './seed';

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

/**
 * Every table this module expects to find, so that one added after the object
 * was cached is noticed rather than read as `undefined`.
 *
 * The dev server keeps the tables across a reload, which is the point of
 * anchoring them on `globalThis` — but it also means an object built by an
 * *older* version of this file survives into a newer one. Adding
 * `walletEntries` did exactly that: every page that touched it threw
 * «Cannot read properties of undefined», in a session that had been running
 * since before the field existed.
 *
 * Checking the shape and rebuilding is better than remembering to bump a
 * version: the new table would have been empty either way, so there is
 * nothing to preserve, and nothing to forget to do.
 */
const TABLE_NAMES: readonly (keyof Tables)[] = [
  'customers',
  'byMobile',
  'addresses',
  'sessions',
  'challenges',
  'orders',
  'payments',
  'carts',
  'drafts',
  'placedOrders',
  'walletEntries',
];

function isComplete(candidate: Tables): boolean {
  return TABLE_NAMES.every((name) => candidate[name] !== undefined);
}

export function tables(): Tables {
  const holder = globalThis as GlobalWithTables;
  const existing = holder[TABLES_KEY];
  if (existing !== undefined && isComplete(existing)) return existing;

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

/** Throw the tables away. For tests, which must not share state. */
export function resetAccountStore(): void {
  const holder = globalThis as GlobalWithTables;
  delete holder[TABLES_KEY];
}
