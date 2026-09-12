import type { Metadata } from 'next';
import Link from 'next/link';
import { toPersianDigits } from '@sharghigold/ui';

import { PageHead } from '@/components/account/page-head';
import { WalletIcon } from '@/components/icons';
import { jalaliDate, toman } from '@/lib/account-view';
import { routes } from '@/lib/routes';
import { requireViewer } from '@/server/account/session';
import { getWallet, listWalletHistory } from '@/server/wallet/top-up';

import '../../account.css';
import '../wallet.css';
import './transactions.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'گردش کیف پول',
  robots: { index: false, follow: false },
};

/** «تومان» sits beside the figure; the sign is drawn, never typed as a hyphen. */
const MINUS = '−';

const KIND_LABEL: Readonly<Record<string, string>> = {
  'top-up': 'افزایش موجودی',
  order: 'خرید',
  refund: 'بازگشت وجه',
};

/**
 * The wallet ledger.
 *
 * Two places linked here — the wallet card on the account page and the top-up
 * screen — and the route did not exist. Worse, neither did the data: the
 * balance was a single number on the customer record, so a customer whose
 * balance had dropped had no way to find out what had taken it, and neither
 * did support.
 *
 * Every entry is written in the same pass as the balance change that caused
 * it, and carries the balance it left behind. A running total recomputed at
 * read time gives a different answer whenever a row is inserted out of order,
 * and the figure a customer was shown when they looked is the one they will
 * quote back.
 */
export default async function WalletTransactionsPage() {
  const viewer = await requireViewer();
  const wallet = getWallet(viewer);
  const entries = listWalletHistory(viewer);

  return (
    <div className="zn-shell zn-shell--plain">
      <PageHead title="گردش کیف پول" back={routes.account()} />

      <main className="zn-ledger">
        <section className="zn-ledger__balance">
          <span className="zn-ledger__label">موجودی فعلی</span>
          <span className="zn-ledger__figure">
            {toman(wallet.balanceRials)}
            <span className="zn-ledger__unit">تومان</span>
          </span>
          <Link className="zn-ledger__topup" href={routes.walletTopUp()}>
            افزایش موجودی
          </Link>
        </section>

        {entries.length === 0 ? (
          <div className="zn-empty">
            <span className="zn-empty__glyph" aria-hidden="true">
              <WalletIcon size={26} strokeWidth={1.6} />
            </span>
            <p className="zn-empty__title">هنوز گردشی ثبت نشده است</p>
            <p className="zn-empty__body">
              هر افزایش موجودی، خرید یا بازگشت وجه اینجا با تاریخ و مانده ثبت می‌شود.
            </p>
          </div>
        ) : (
          <ol className="zn-ledger__list">
            {entries.map((entry) => {
              const outgoing = entry.amountRials.startsWith('-');
              const magnitude = outgoing ? entry.amountRials.slice(1) : entry.amountRials;

              return (
                <li className="zn-ledgerrow" key={entry.id}>
                  <span className="zn-ledgerrow__text">
                    <span className="zn-ledgerrow__label">{entry.label}</span>
                    <span className="zn-ledgerrow__meta">
                      <span>{KIND_LABEL[entry.kind] ?? entry.kind}</span>
                      <span aria-hidden="true">·</span>
                      <time dateTime={entry.at}>{jalaliDate(entry.at)}</time>
                    </span>
                    {entry.reference === null ? null : (
                      <span className="zn-ledgerrow__ref">{toPersianDigits(entry.reference)}</span>
                    )}
                  </span>

                  <span className="zn-ledgerrow__amounts">
                    <span
                      className={`zn-ledgerrow__amount${outgoing ? ' zn-ledgerrow__amount--out' : ''}`}
                    >
                      {/* A screen reader should hear «منها», not a dash. */}
                      <span className="sr-only">{outgoing ? 'برداشت ' : 'واریز '}</span>
                      <span aria-hidden="true">{outgoing ? MINUS : '+'}</span>
                      {toman(magnitude)}
                    </span>
                    <span className="zn-ledgerrow__after">
                      {`مانده: ${toman(entry.balanceAfterRials)}`}
                    </span>
                  </span>
                </li>
              );
            })}
          </ol>
        )}

        <div className="zn-account__tail" />
      </main>
    </div>
  );
}
