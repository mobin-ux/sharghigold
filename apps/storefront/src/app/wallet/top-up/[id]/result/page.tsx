import { Alert } from '@sharghigold/ui';
import type { Metadata } from 'next';
import Link from 'next/link';

import { routes } from '@/lib/routes';
import { notFound } from 'next/navigation';

import { SubmitButton } from '@/components/account/submit-button';
import { CheckIcon, ClockIcon, CloseIcon, RiseIcon } from '@/components/icons';
import {
  receiptStamp,
  referenceLabel,
  RESULT_COPY,
  toman,
  type ResultTone,
} from '@/lib/wallet-view';
import { requireViewer } from '@/server/account/session';
import { getReceipt } from '@/server/wallet/top-up';

import { recheckPayment } from '../../actions';
import { ReceiptCard, type ReceiptRow } from './receipt-card';

import '../../../wallet.css';
import '../../../../account/account.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'نتیجه پرداخت',
  robots: { index: false, follow: false },
};

/** One glyph per ending, so the state is not carried by colour alone. */
function resultIcon(status: string) {
  switch (status) {
    case 'succeeded':
      return <CheckIcon size={34} strokeWidth={2.2} />;
    case 'pending':
      return <ClockIcon size={32} />;
    default:
      return <CloseIcon size={32} strokeWidth={2} />;
  }
}

const TONE_COLOUR: Record<ResultTone, string> = {
  good: 'var(--color-success-text)',
  bad: 'var(--color-danger-text)',
  pending: 'var(--color-warning-text)',
  idle: 'var(--color-text-secondary)',
};

export default async function ResultPage({
  params,
}: {
  readonly params: Promise<{ readonly id: string }>;
}) {
  const viewer = await requireViewer();
  const { id } = await params;

  const receipt = getReceipt(viewer, id);
  if (receipt === undefined) notFound();

  const copy = RESULT_COPY[receipt.status];
  const settled = receipt.status === 'succeeded' || receipt.status === 'pending';

  const rows: readonly ReceiptRow[] = [
    { key: 'amount', label: 'مبلغ', value: toman(receipt.amountRials), unit: true },
    { key: 'status', label: 'وضعیت', value: copy.status, tone: TONE_COLOUR[copy.tone] },
    {
      key: 'reference',
      label: 'شماره پیگیری',
      value: settled ? referenceLabel(receipt.reference) : '—',
      ltr: true,
    },
    {
      key: 'stamp',
      label: 'تاریخ',
      value: receiptStamp(receipt.settledAt ?? receipt.createdAt),
      ltr: true,
    },
  ];

  return (
    <div className="zn-shell zn-shell--plain zn-result">
      <header className="zn-result__top">
        <Link className="zn-result__close" href={routes.account()} aria-label="بستن">
          <CloseIcon size={17} strokeWidth={1.8} />
        </Link>
      </header>

      <div className="zn-result__body">
        <span className={`zn-result__glyph zn-result__glyph--${copy.tone}`} aria-hidden="true">
          {resultIcon(receipt.status)}
        </span>
        <h1 className="zn-result__title" role="status">
          {copy.title}
        </h1>

        <div className="zn-result__alert">
          <Alert variant={copy.variant}>{copy.note}</Alert>
        </div>

        <ReceiptCard rows={rows} reference={settled ? receipt.reference : null} />

        {receipt.status === 'succeeded' && receipt.balanceAfterRials !== null ? (
          <section className="zn-newbalance" aria-label="موجودی جدید">
            <span className="zn-newbalance__text">
              <span className="zn-newbalance__label">موجودی جدید کیف پول</span>
              <span className="zn-newbalance__amount">
                <span className="zn-newbalance__figure">{toman(receipt.balanceAfterRials)}</span>
                <span className="zn-newbalance__unit">تومان</span>
              </span>
            </span>
            <span className="zn-newbalance__delta">
              <RiseIcon size={14} strokeWidth={2.4} />
              {toman(receipt.amountRials)}
            </span>
          </section>
        ) : null}

        {receipt.status === 'pending' ? (
          <form className="zn-result__recheck" action={recheckPayment}>
            <input type="hidden" name="id" value={id} />
            <SubmitButton className="zn-result__recheckbutton" pendingLabel="در حال بررسی…">
              <span className="zn-result__pulse" aria-hidden="true" />
              بررسی دوباره وضعیت پرداخت
            </SubmitButton>
          </form>
        ) : null}
      </div>

      <div className="zn-result__ctas">
        {receipt.status === 'succeeded' ? (
          <Link className="zn-result__go" href={routes.categories()}>
            ادامه خرید طلا
          </Link>
        ) : null}

        <Link
          className={`zn-result__back${receipt.status === 'succeeded' ? '' : ' zn-result__back--only'}`}
          href={routes.account()}
        >
          بازگشت به حساب کاربری
        </Link>

        {copy.retry ? (
          <Link className="zn-result__retry" href={routes.walletTopUp()}>
            تلاش دوباره
          </Link>
        ) : null}

        <Link className="zn-result__support" href={routes.contact()}>
          پیگیری از پشتیبانی
        </Link>
      </div>
    </div>
  );
}
