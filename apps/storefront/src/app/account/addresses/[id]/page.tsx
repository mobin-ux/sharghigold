import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PageHead } from '@/components/account/page-head';
import { PROVINCES } from '@/data/iran-regions';
import { getAddress } from '@/server/account/account';
import { requireViewer } from '@/server/account/session';

import { AddressForm } from '../address-form';

import '../../account.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'ویرایش آدرس',
  robots: { index: false, follow: false },
};

export default async function EditAddressPage({
  params,
}: {
  readonly params: Promise<{ readonly id: string }>;
}) {
  const viewer = await requireViewer();
  const { id } = await params;

  // Looked up inside this viewer's own addresses. An id that belongs to
  // somebody else is a 404, indistinguishable from an id that belongs to
  // nobody — a «forbidden» here would confirm that the row exists.
  const address = getAddress(viewer, id);
  if (address === undefined) notFound();

  return (
    <div className="zn-shell zn-flow">
      <PageHead title="ویرایش آدرس" back="/account/addresses" />
      <AddressForm
        initial={{
          id: address.id,
          province: address.province,
          city: address.city,
          line: address.line,
          plate: address.plate,
          unit: address.unit ?? '',
          postalCode: address.postalCode,
          label: address.label,
          isDefault: address.isDefault,
          deliverToSelf: address.recipientMobile === viewer.customer.mobile,
          recipientName: address.recipientName,
          recipientMobile: address.recipientMobile,
        }}
        regions={PROVINCES}
        mobile={viewer.customer.mobile}
        editing
      />
    </div>
  );
}
