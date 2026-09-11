import { Spinner } from '@sharghigold/ui';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { SubmitButton } from '@/components/account/submit-button';
import { toman } from '@/lib/wallet-view';
import { requireViewer } from '@/server/account/session';
import { getReceipt } from '@/server/wallet/top-up';

import { cancelPayment } from '../actions';
import { GatewayForm } from './gateway-form';

import '../../wallet.css';
import '../../../account/account.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'انتقال به درگاه بانکی',
  robots: { index: false, follow: false },
};

/**
 * Waiting at the bank.
 *
 * A payment that is already settled never shows this screen: landing here with
 * a finished payment means the customer pressed back, and the answer to that is
 * the receipt they already have, not a second trip to a bank that is done with
 * them.
 */
export default async function GatewayPage({
  params,
}: {
  readonly params: Promise<{ readonly id: string }>;
}) {
  const viewer = await requireViewer();
  const { id } = await params;

  const receipt = getReceipt(viewer, id);
  if (receipt === undefined) notFound();
  if (receipt.status !== 'pending') redirect(`/wallet/top-up/${id}/result`);

  return (
    <div className="zn-shell zn-shell--plain zn-gateway">
      <div className="zn-gateway__body" role="status" aria-busy="true">
        <Spinner size="lg" label="در حال انتقال به درگاه بانکی" />
        <h1 className="zn-gateway__title">در حال انتقال به درگاه بانکی</h1>
        <p className="zn-gateway__lead">
          چند لحظه صبر کنید. صفحه را نبندید و از دکمه بازگشت مرورگر استفاده نکنید.
        </p>
        <p className="zn-gateway__amount">
          <span className="zn-gateway__figure">{toman(receipt.amountRials)}</span>
          <span className="zn-gateway__unit">تومان</span>
        </p>

        <GatewayForm id={id} />

        <form className="zn-gateway__cancel" action={cancelPayment}>
          <input type="hidden" name="id" value={id} />
          <SubmitButton className="zn-gateway__cancelbutton" pendingLabel="در حال لغو…">
            انصراف از پرداخت
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}
