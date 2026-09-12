import { randomUUID } from 'node:crypto';

import { newNumericCode } from '../crypto';

import { assertAvailable } from './availability';
import type { CustomerRecord } from './records';
import { tables } from './tables';

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
