import { refundDestinationSchema, returnReasonSchema } from '@sharghigold/contracts';
import { toPersianDigits } from '@sharghigold/money';
import { OrderStepper } from '@sharghigold/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { OrderHeader } from '@/components/orders/order-chrome';
import { ReturnForm, WithdrawReturnButton } from '@/components/orders/order-forms';
import { toman } from '@/lib/account-view';
import {
  REFUND_DESTINATION,
  RETURN_REASON_LABEL,
  RETURN_STEP_LABELS,
  returnNextSteps,
  returnStepperCurrent,
} from '@/lib/order-file-view';
import { persianCount } from '@/lib/product-view';
import { routes } from '@/lib/routes';
import { RETURN_WINDOW_DAYS } from '@/server/orders/order-file';

import '../../../account.css';
import '../../orders.css';
import { loadOrder } from '../load';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'مرجوعی',
  robots: { index: false, follow: false },
};

/**
 * One address for a return: the request form while one may be made, and the
 * request's status once it has been.
 *
 * The canvas has no photo upload the shop can receive yet, so the form asks for
 * none; the piece is inspected when it is collected, which the lead says.
 */
export default async function OrderReturnPage({
  params,
}: {
  readonly params: Promise<{ readonly code: string }>;
}) {
  const { order } = await loadOrder(params);
  const back = routes.accountOrder(order.code);

  if (order.allowed.requestReturn) {
    return (
      <div className="zn-shell zn-shell--plain">
        <div className="zn-ordform">
          <OrderHeader back={back} title="درخواست مرجوعی" />
          <ReturnForm
            code={order.code}
            lead={`تا ${persianCount(RETURN_WINDOW_DAYS)} روز پس از تحویل، کالای دست‌نخورده همراه با پلمب و فاکتور قابل مرجوع کردن است. کارشناس ما پس از بررسی با شما تماس می‌گیرد و کالا هنگام دریافت بررسی می‌شود.`}
            pieces={order.lines.map((line) => ({
              index: line.index,
              title: line.title,
              price: toman(line.totalRials),
            }))}
            reasons={returnReasonSchema.options.map((value) => ({
              value,
              label: RETURN_REASON_LABEL[value],
            }))}
            destinations={refundDestinationSchema.options.map((value) => ({
              value,
              ...REFUND_DESTINATION[value],
              note:
                value === 'bank' && !order.allowed.refundToBank
                  ? 'نیازمند شبای تأییدشده'
                  : REFUND_DESTINATION[value].note,
              available: value === 'wallet' || order.allowed.refundToBank,
            }))}
          />
        </div>
      </div>
    );
  }

  const request = order.returnRequest;
  if (request === null) redirect(back);

  const titles = request.lineIndexes.map((index) => order.lines[index]?.title).filter(Boolean);
  const withdrawable = request.stage === 'reviewing' || request.stage === 'collecting';

  return (
    <div className="zn-shell">
      <OrderHeader
        back={back}
        title="وضعیت مرجوعی"
        end={
          <span className="zn-ordhead__end zn-ordhead__end--code">
            {toPersianDigits(request.code)}
          </span>
        }
      />

      <main>
        {request.stage === 'withdrawn' ? null : (
          <section className="zn-ordsec">
            <OrderStepper
              steps={RETURN_STEP_LABELS}
              current={returnStepperCurrent(request.stage)}
              label="مراحل مرجوعی"
            />
          </section>
        )}

        <section className="zn-ordsec" aria-label="جزئیات درخواست">
          <dl className="zn-ordpairs zn-ordpairs--9">
            <div className="zn-ordpair zn-ordpair--top">
              <dt>کالا</dt>
              <dd className="zn-ordpair__value--wrap">{titles.join('، ')}</dd>
            </div>
            <div className="zn-ordpair">
              <dt>دلیل</dt>
              <dd>{RETURN_REASON_LABEL[request.reason]}</dd>
            </div>
            <div className="zn-ordpair">
              <dt>مبلغ بازگشتی</dt>
              <dd className="zn-ordpair__value--num zn-ordpair__value--big">
                {`${toman(request.refundRials)} تومان`}
              </dd>
            </div>
            <div className="zn-ordpair">
              <dt>مقصد وجه</dt>
              <dd>{REFUND_DESTINATION[request.refundTo].label}</dd>
            </div>
          </dl>
        </section>

        <section className="zn-ordsec" aria-labelledby="return-next">
          <h2 className="zn-ordsec__title" id="return-next" data-gap="10">
            مراحل بعدی
          </h2>
          <p className="zn-ordnext">{returnNextSteps(request.stage)}</p>
        </section>

        <div className="zn-ordpad zn-ordpad--row">
          <Link
            className="zn-ordbtn zn-ordbtn--surface"
            href={routes.accountOrderSupport(order.code)}
          >
            گفت‌وگو با پشتیبانی
          </Link>
          {withdrawable ? <WithdrawReturnButton code={order.code} /> : null}
        </div>
        <div className="zn-ordtail" />
      </main>
    </div>
  );
}
