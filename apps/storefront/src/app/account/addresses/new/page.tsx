import type { Metadata } from 'next';

import { PageHead } from '@/components/account/page-head';
import { DEFAULT_PROVINCE, PROVINCES } from '@/data/iran-regions';
import { requireViewer } from '@/server/account/session';

import { AddressForm } from '../address-form';
import { EMPTY_ADDRESS } from '../state';

import '../../account.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'افزودن آدرس جدید',
  robots: { index: false, follow: false },
};

export default async function NewAddressPage() {
  const viewer = await requireViewer();

  return (
    <div className="zn-shell zn-flow">
      <PageHead title="افزودن آدرس جدید" back="/account/addresses" />
      <AddressForm
        initial={{ ...EMPTY_ADDRESS, province: DEFAULT_PROVINCE, city: DEFAULT_PROVINCE }}
        regions={PROVINCES}
        mobile={viewer.customer.mobile}
        editing={false}
      />
    </div>
  );
}
