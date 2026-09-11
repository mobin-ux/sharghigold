import type { Metadata } from 'next';
import Link from 'next/link';

import { ConfirmButton } from '@/components/account/confirm-button';
import { Flash } from '@/components/account/flash';
import { PageHead } from '@/components/account/page-head';
import { SubmitButton } from '@/components/account/submit-button';
import { PinIcon, PlusIcon, TrashIcon } from '@/components/icons';
import { addressLine, ADDRESS_LABEL_TEXT, postalLabel } from '@/lib/account-view';
import { getAddresses } from '@/server/account/account';
import { requireViewer } from '@/server/account/session';

import { deleteAddress, makeDefault } from './actions';

import '../account.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'آدرس‌های من',
  robots: { index: false, follow: false },
};

export default async function AddressesPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const addresses = getAddresses(await requireViewer());
  const done = (await searchParams)['done'];

  return (
    <div className="zn-shell zn-shell--plain">
      <PageHead title="آدرس‌های من" back="/account" />

      <main className="zn-addresses">
        <Flash code={typeof done === 'string' ? done : undefined} />

        {addresses.length === 0 ? (
          <div className="zn-empty">
            <span className="zn-empty__glyph" aria-hidden="true">
              <PinIcon size={26} strokeWidth={1.6} />
            </span>
            <p className="zn-empty__title">هنوز آدرسی ثبت نکرده‌اید</p>
            <p className="zn-empty__body">برای تحویل سفارش، یک آدرس اضافه کنید.</p>
          </div>
        ) : (
          <ul className="zn-addresses__list">
            {addresses.map((address) => (
              <li
                className={`zn-addr${address.isDefault ? ' zn-addr--default' : ''}`}
                key={address.id}
              >
                <h2 className="zn-addr__head">
                  <span className="zn-addr__title">{ADDRESS_LABEL_TEXT[address.label]}</span>
                  {address.isDefault ? <span className="zn-addr__badge">آدرس پیش‌فرض</span> : null}
                </h2>
                <p className="zn-addr__line">{addressLine(address)}</p>
                <p className="zn-addr__postal">{postalLabel(address.postalCode)}</p>

                <div className="zn-addr__actions">
                  {address.isDefault ? null : (
                    <form action={makeDefault}>
                      <input type="hidden" name="addressId" value={address.id} />
                      <SubmitButton className="zn-addr__ghost" pendingLabel="…">
                        انتخاب به‌عنوان پیش‌فرض
                      </SubmitButton>
                    </form>
                  )}

                  <Link className="zn-addr__ghost" href={`/account/addresses/${address.id}`}>
                    ویرایش
                  </Link>

                  <ConfirmButton
                    action={deleteAddress}
                    className="zn-addr__trash"
                    label={<TrashIcon size={16} />}
                    accessibleLabel={`حذف آدرس ${ADDRESS_LABEL_TEXT[address.label]}`}
                    title="حذف این آدرس؟"
                    body="این آدرس از حساب شما پاک می‌شود و قابل بازگرداندن نیست."
                    confirm="حذف آدرس"
                  >
                    <input type="hidden" name="addressId" value={address.id} />
                  </ConfirmButton>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="zn-addresses__add">
          <Link className="zn-addresses__button" href="/account/addresses/new">
            <PlusIcon size={17} />
            افزودن آدرس جدید
          </Link>
        </div>

        <div className="zn-account__tail" />
      </main>
    </div>
  );
}
