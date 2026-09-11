'use server';

import { iranianNationalIdSchema, profileUpdateSchema } from '@sharghigold/contracts';
import { toLatinDigits } from '@sharghigold/money';
import { redirect } from 'next/navigation';

import { updateProfile } from '@/server/account/account';
import { requireViewer } from '@/server/account/session';

import type { ProfileDraft, ProfileState } from './state';

function read(form: FormData, key: string): string {
  const raw = form.get(key);
  return typeof raw === 'string' ? raw.trim() : '';
}

/**
 * Save the two fields the profile owns.
 *
 * Note what the form does not send and this does not read: the mobile number.
 * It is the account identity, changing it changes who the account belongs to,
 * and that goes through a verified code on the new number rather than through
 * a text field. A `mobile` in this body would be ignored; there is simply
 * nowhere for it to go.
 *
 * The national ID is checked for its check digit, not only its length. Ten
 * digits that fail the modulus are a typo, and catching it here is far cheaper
 * than failing halfway through a credit check.
 */
export async function saveProfile(_previous: ProfileState, form: FormData): Promise<ProfileState> {
  const viewer = await requireViewer();

  const draft: ProfileDraft = {
    displayName: read(form, 'displayName'),
    nationalId: toLatinDigits(read(form, 'nationalId')),
  };

  if (draft.nationalId !== '' && !iranianNationalIdSchema.safeParse(draft.nationalId).success) {
    return {
      status: 'invalid',
      message: 'کد ملی معتبر نیست. ۱۰ رقم، بدون خط تیره.',
      field: 'nationalId',
      draft,
    };
  }

  const parsed = profileUpdateSchema.safeParse({
    displayName: draft.displayName === '' ? null : draft.displayName,
    nationalId: draft.nationalId === '' ? null : draft.nationalId,
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      status: 'invalid',
      message: first?.message ?? 'تغییرات ذخیره نشد.',
      field: first?.path[0] === 'nationalId' ? 'nationalId' : 'displayName',
      draft,
    };
  }

  const result = updateProfile(viewer, parsed.data);

  if (result.status === 'locked') {
    return {
      status: 'invalid',
      message: 'کد ملی پس از تأیید هویت قابل تغییر نیست. برای اصلاح با پشتیبانی تماس بگیرید.',
      field: 'nationalId',
      draft,
    };
  }

  redirect('/account?done=saved');
}
