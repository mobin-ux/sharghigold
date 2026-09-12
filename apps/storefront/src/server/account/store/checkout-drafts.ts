import { assertAvailable } from './availability';
import type { CheckoutDraftRecord } from './records';
import { tables } from './tables';

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
