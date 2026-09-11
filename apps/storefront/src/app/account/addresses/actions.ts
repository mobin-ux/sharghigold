'use server';

import { addressDraftSchema, addressLabelSchema, uuidSchema } from '@sharghigold/contracts';
import { toLatinDigits } from '@sharghigold/money';
import { redirect } from 'next/navigation';

import { chooseDefaultAddress, removeAddress, writeAddress } from '@/server/account/account';
import { consume } from '@/server/account/rate-limit';
import { requireViewer } from '@/server/account/session';

import type { AddressDraftFields, AddressField, AddressState } from './state';

function read(form: FormData, key: string): string {
  const raw = form.get(key);
  return typeof raw === 'string' ? raw.trim() : '';
}

/** Read the whole form back, so a rejection returns everything that was typed. */
function readDraft(form: FormData): AddressDraftFields {
  const label = addressLabelSchema.safeParse(read(form, 'label'));

  return {
    id: read(form, 'id'),
    province: read(form, 'province'),
    city: read(form, 'city'),
    line: read(form, 'line'),
    plate: toLatinDigits(read(form, 'plate')),
    unit: toLatinDigits(read(form, 'unit')),
    postalCode: toLatinDigits(read(form, 'postalCode')),
    label: label.success ? label.data : 'home',
    isDefault: form.get('isDefault') === 'on',
    deliverToSelf: form.get('deliverToSelf') === 'on',
    recipientName: read(form, 'recipientName'),
    recipientMobile: toLatinDigits(read(form, 'recipientMobile')),
  };
}

/** Which field a Zod issue belongs under. */
function fieldOf(path: PropertyKey | undefined): AddressField {
  switch (path) {
    case 'plate':
      return 'plate';
    case 'postalCode':
      return 'postalCode';
    case 'recipientName':
      return 'recipientName';
    case 'recipientMobile':
      return 'recipientMobile';
    case 'province':
    case 'city':
      return 'region';
    case 'line':
      return 'line';
    default:
      return 'form';
  }
}

/**
 * Create an address, or replace one that already exists.
 *
 * The row being edited is named by a hidden field, and that is safe for one
 * reason only: the server resolves it inside the viewer's own addresses. An id
 * belonging to somebody else resolves to nothing and comes back as «not
 * found», which is the same answer as an id belonging to nobody — a distinct
 * «forbidden» would confirm that the row exists (rule 8).
 *
 * The province and city are checked against the delivery table rather than
 * accepted as the text they are. Two `<select>` elements on the page do not
 * constrain what a request body contains.
 */
export async function saveAddress(_previous: AddressState, form: FormData): Promise<AddressState> {
  const viewer = await requireViewer();
  const draft = readDraft(form);

  const budget = consume('address:write', viewer.customer.id);
  if (!budget.allowed) {
    return {
      status: 'invalid',
      message: 'تعداد تغییرات آدرس بیش از حد مجاز بود. کمی بعد دوباره تلاش کنید.',
      field: 'form',
      draft,
    };
  }

  const shared = {
    label: draft.label,
    province: draft.province,
    city: draft.city,
    line: draft.line,
    plate: draft.plate,
    unit: draft.unit === '' ? null : draft.unit,
    postalCode: draft.postalCode,
    isDefault: draft.isDefault,
  };

  const parsed = addressDraftSchema.safeParse(
    draft.deliverToSelf
      ? { deliverToSelf: true, ...shared }
      : {
          deliverToSelf: false,
          ...shared,
          recipientName: draft.recipientName,
          recipientMobile: draft.recipientMobile,
        },
  );

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      status: 'invalid',
      message: first?.message ?? 'آدرس ثبت نشد. موارد مشخص‌شده را کامل کنید.',
      field: fieldOf(first?.path[0]),
      draft,
    };
  }

  const id = uuidSchema.safeParse(draft.id);
  const result = writeAddress(viewer, parsed.data, id.success ? id.data : undefined);

  if (result.status === 'unknown-region') {
    return {
      status: 'invalid',
      message: 'این شهر در فهرست مناطق تحت پوشش نیست.',
      field: 'region',
      draft,
    };
  }

  if (result.status === 'not-found') {
    return {
      status: 'invalid',
      message: 'این آدرس دیگر در حساب شما وجود ندارد.',
      field: 'form',
      draft,
    };
  }

  redirect(`/account/addresses?done=${id.success ? 'address-updated' : 'address-saved'}`);
}

/**
 * Delete an address.
 *
 * Scoped to the viewer, like everything else here. A delete that names a row
 * the viewer does not own removes nothing and says nothing about whether it
 * existed.
 */
export async function deleteAddress(form: FormData): Promise<void> {
  const viewer = await requireViewer();
  const id = uuidSchema.safeParse(read(form, 'addressId'));

  if (id.success) removeAddress(viewer, id.data);

  redirect('/account/addresses?done=address-removed');
}

/** Move the default marker to another of the viewer's own addresses. */
export async function makeDefault(form: FormData): Promise<void> {
  const viewer = await requireViewer();
  const id = uuidSchema.safeParse(read(form, 'addressId'));

  if (id.success) chooseDefaultAddress(viewer, id.data);

  redirect('/account/addresses?done=address-default');
}
