import { randomUUID } from 'node:crypto';

import { assertAvailable } from './availability';
import type { AddressRecord } from './records';
import { tables } from './tables';

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
