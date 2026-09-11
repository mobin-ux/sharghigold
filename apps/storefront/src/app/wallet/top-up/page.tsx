import { OrderStepper } from '@sharghigold/ui';
import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHead } from '@/components/account/page-head';
import { WalletIcon } from '@/components/icons';
import { toman, TOP_UP_STEPS, weightLabel } from '@/lib/wallet-view';
import { requireViewer } from '@/server/account/session';
import { paymentsAvailable } from '@/server/wallet/psp';
import { getWallet } from '@/server/wallet/top-up';

import { AmountForm } from './amount-form';

import '../wallet.css';
import '../../account/account.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'افزایش موجودی',
  robots: { index: false, follow: false },
};

export default async function TopUpPage() {
  const viewer = await requireViewer();
  const wallet = getWallet(viewer);

  return (
    <div className="zn-shell zn-shell--plain zn-topup">
      <PageHead
        title="افزایش موجودی"
        back="/account"
        trailing={
          <Link className="zn-topup__ledger" href="/wallet/transactions">
            تراکنش‌ها
          </Link>
        }
      />

      <div className="zn-topup__steps">
        <OrderStepper steps={TOP_UP_STEPS} current={0} label="مراحل افزایش موجودی" />
      </div>

      <section className="zn-purseline" aria-label="موجودی فعلی">
        <span className="zn-purseline__icon" aria-hidden="true">
          <WalletIcon size={18} strokeWidth={1.75} />
        </span>
        <span className="zn-purseline__text">
          <span className="zn-purseline__label">موجودی فعلی کیف پول</span>
          <span className="zn-purseline__amount">
            <span className="zn-purseline__figure">{toman(wallet.balanceRials)}</span>
            <span className="zn-purseline__unit">تومان</span>
          </span>
        </span>
        <span className="zn-purseline__gold">
          طلای آبشده
          <b className="zn-purseline__grams">{weightLabel(wallet.goldMilligrams, false)} گرم</b>
        </span>
      </section>

      <AmountForm balanceRials={wallet.balanceRials} canSimulate={paymentsAvailable()} />
    </div>
  );
}
