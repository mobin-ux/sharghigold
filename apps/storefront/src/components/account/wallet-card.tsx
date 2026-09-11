import Link from 'next/link';

import { InfoIcon, WalletIcon } from '@/components/icons';
import { toman } from '@/lib/account-view';

/**
 * The wallet balance and what can be done with it.
 *
 * The figure arrives as a string of whole rials and is grouped for display.
 * Nothing on this card adds anything to anything: a balance is a fact from the
 * ledger, and the moment a page computes one it can disagree with it.
 */
export function WalletCard({ balanceRials }: { readonly balanceRials: string }) {
  return (
    <section className="zn-purse" aria-labelledby="zn-purse-h">
      <span className="zn-purse__glow" aria-hidden="true" />
      <h2 className="zn-purse__head" id="zn-purse-h">
        <WalletIcon size={18} strokeWidth={1.75} />
        موجودی کیف پول
      </h2>
      <p className="zn-purse__amount">
        <span className="zn-purse__figure">{toman(balanceRials)}</span>
        <span className="zn-purse__unit">تومان</span>
      </p>
      <p className="zn-purse__actions">
        <Link className="zn-purse__cta" href="/wallet/top-up">
          افزایش موجودی
        </Link>
        <Link className="zn-purse__ghost" href="/wallet/transactions">
          تراکنش‌ها
        </Link>
      </p>
      <p className="zn-purse__note">
        <InfoIcon size={15} strokeWidth={1.8} />
        <span>
          برای خرید اقساطی، ابتدا اعتباری که از شرکت‌های همکار دریافت کرده‌اید را از بخش افزایش
          موجودی به زرنما منتقل کنید، سپس خرید خود را نهایی کنید.
        </span>
      </p>
    </section>
  );
}
