'use client';

import Link from 'next/link';
import { useActionState, type ReactNode } from 'react';

import {
  submitCancellation,
  submitInstalmentPayment,
  submitOrderMessage,
  submitOrderReview,
  submitReorder,
  submitReturn,
  submitReturnWithdrawal,
} from '@/app/account/orders/actions';
import { ORDER_FORM_IDLE, type OrderFormState } from '@/app/account/orders/state';
import type {
  CancelReason,
  RefundDestination,
  ReturnReason,
  ReviewTag,
} from '@sharghigold/contracts';

import {
  ActionIcon,
  ChevronStartIcon,
  PieceIcon,
  SendIcon,
  StarIcon,
  TickIcon,
} from './order-icons';

/**
 * The order screens' forms.
 *
 * Every one posts to a Server Action and works without JavaScript: the choices
 * are real radio buttons and checkboxes, and the canvas's selected states and
 * its grey-until-complete buttons are drawn by CSS reading those inputs. The
 * only thing a script adds is showing a refusal without a full reload.
 *
 * None of them sends an amount. The code names the order; the server looks it
 * up among the customer's own and works out the rest.
 */

function Refusal({ state }: { readonly state: OrderFormState }) {
  return (
    <p className="zn-ordhint zn-ordhint--error" role="alert" hidden={state.status !== 'error'}>
      {state.status === 'error' ? state.message : ''}
    </p>
  );
}

function Radio({
  name,
  value,
  label,
}: {
  readonly name: string;
  readonly value: string;
  readonly label: string;
}) {
  return (
    <label className="zn-ordchoice">
      <input className="zn-ordchoice__input" type="radio" name={name} value={value} required />
      <span className="zn-ordchoice__radio" aria-hidden="true" />
      <span className="zn-ordchoice__label">{label}</span>
    </label>
  );
}

/* -------------------------------------------------------------------------- */
/* Cancel                                                                     */
/* -------------------------------------------------------------------------- */

export function CancelForm({
  code,
  back,
  reasons,
  refund,
  lead,
}: {
  readonly code: string;
  readonly back: string;
  readonly reasons: readonly { readonly value: CancelReason; readonly label: string }[];
  /** The refund, already formatted by the page from the order record. */
  readonly refund: string;
  readonly lead: string;
}) {
  const [state, action, pending] = useActionState(submitCancellation, ORDER_FORM_IDLE);

  return (
    <form className="zn-ordform__rest" action={action}>
      <input type="hidden" name="code" value={code} />
      <p className="zn-ordlead">{lead}</p>

      <fieldset className="zn-ordfield">
        <legend className="zn-ordfield__legend">دلیل لغو</legend>
        <div className="zn-ordfield__stack">
          {reasons.map((reason) => (
            <Radio key={reason.value} name="reason" value={reason.value} label={reason.label} />
          ))}
        </div>
      </fieldset>

      <div className="zn-ordfield zn-ordfield--16">
        <label className="zn-ordfield__label" htmlFor="cancel-note">
          توضیح بیشتر (اختیاری)
        </label>
        <textarea
          className="zn-ordtextarea"
          id="cancel-note"
          name="note"
          rows={3}
          maxLength={300}
          placeholder="اگر نکته‌ای هست بنویسید"
        />
      </div>

      <div className="zn-ordfield zn-ordfield--16">
        <div className="zn-ordrefund">
          <span className="zn-ordrefund__label">مبلغ بازگشتی</span>
          <span className="zn-ordrefund__amount">
            <span className="zn-ordrefund__figure">{refund}</span>
            <span className="zn-ordrefund__unit">تومان</span>
          </span>
        </div>
      </div>

      <Refusal state={state} />

      <div className="zn-orddock">
        <Link className="zn-orddock__back" href={back}>
          بازگشت
        </Link>
        <button
          className="zn-orddock__submit zn-orddock__submit--cancel"
          type="submit"
          disabled={pending}
        >
          لغو سفارش
        </button>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Return                                                                     */
/* -------------------------------------------------------------------------- */

export function ReturnForm({
  code,
  lead,
  pieces,
  reasons,
  destinations,
}: {
  readonly code: string;
  readonly lead: string;
  readonly pieces: readonly {
    readonly index: number;
    readonly title: string;
    readonly price: string;
  }[];
  readonly reasons: readonly { readonly value: ReturnReason; readonly label: string }[];
  readonly destinations: readonly {
    readonly value: RefundDestination;
    readonly label: string;
    readonly note: string;
    readonly available: boolean;
  }[];
}) {
  const [state, action, pending] = useActionState(submitReturn, ORDER_FORM_IDLE);

  return (
    <form className="zn-ordform__rest" action={action}>
      <input type="hidden" name="code" value={code} />
      <p className="zn-ordlead">{lead}</p>

      <fieldset className="zn-ordfield">
        <legend className="zn-ordfield__legend">انتخاب کالا</legend>
        <div className="zn-ordfield__stack">
          {pieces.map((piece, position) => (
            <label className="zn-ordchoice zn-ordchoice--piece" key={piece.index}>
              <input
                className="zn-ordchoice__input"
                type="checkbox"
                name="lines"
                value={piece.index}
                defaultChecked={position === 0}
              />
              <span className="zn-ordcheck" aria-hidden="true">
                <TickIcon />
              </span>
              <span className="zn-ordthumb zn-ordthumb--44" aria-hidden="true">
                <PieceIcon size={22} />
              </span>
              <span className="zn-ordpiece__text">
                <span className="zn-ordpiece__title">{piece.title}</span>
                <span className="zn-ordpiece__price">{`${piece.price} تومان`}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="zn-ordfield">
        <legend className="zn-ordfield__legend">دلیل مرجوع کردن</legend>
        <div className="zn-ordfield__stack">
          {reasons.map((reason) => (
            <Radio key={reason.value} name="reason" value={reason.value} label={reason.label} />
          ))}
        </div>
      </fieldset>

      <fieldset className="zn-ordfield">
        <legend className="zn-ordfield__legend">بازگشت وجه به</legend>
        <div className="zn-ordfield__pair">
          {destinations.map((destination) => (
            <label className="zn-ordchoice zn-ordchoice--dest" key={destination.value}>
              <input
                className="zn-ordchoice__input"
                type="radio"
                name="refundTo"
                value={destination.value}
                defaultChecked={destination.value === 'wallet'}
                disabled={!destination.available}
              />
              <span className="zn-ordchoice__label">{destination.label}</span>
              <span className="zn-ordchoice__note">{destination.note}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="zn-ordfield">
        <label className="zn-ordfield__label" htmlFor="return-note">
          توضیح شما
        </label>
        <textarea
          className="zn-ordtextarea"
          id="return-note"
          name="note"
          rows={3}
          maxLength={300}
          placeholder="مشکل کالا را کوتاه شرح دهید"
        />
      </div>

      <p className="zn-ordhint zn-ordhint--pending">کالا و دلیل مرجوع کردن را انتخاب کنید.</p>
      <Refusal state={state} />

      <div className="zn-orddock">
        <button
          className="zn-orddock__submit zn-orddock__submit--return"
          type="submit"
          disabled={pending}
        >
          ثبت درخواست مرجوعی
        </button>
      </div>
    </form>
  );
}

export function WithdrawReturnButton({ code }: { readonly code: string }) {
  const [state, action, pending] = useActionState(submitReturnWithdrawal, ORDER_FORM_IDLE);

  return (
    <form action={action} className="zn-ordwithdraw">
      <input type="hidden" name="code" value={code} />
      <button
        className="zn-ordbtn zn-ordbtn--wide zn-ordbtn--danger"
        type="submit"
        disabled={pending}
      >
        انصراف
      </button>
      <Refusal state={state} />
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Review                                                                     */
/* -------------------------------------------------------------------------- */

export function ReviewForm({
  code,
  pieces,
  tags,
  ratingWords,
}: {
  readonly code: string;
  readonly pieces: readonly string[];
  readonly tags: readonly { readonly value: ReviewTag; readonly label: string }[];
  readonly ratingWords: readonly string[];
}) {
  const [state, action, pending] = useActionState(submitOrderReview, ORDER_FORM_IDLE);

  return (
    <form className="zn-ordform__rest" action={action}>
      <input type="hidden" name="code" value={code} />
      <input type="hidden" name="pieces" value={pieces.length} />

      <div className="zn-ordrev">
        {pieces.map((title, index) => (
          <fieldset className="zn-ordrev__card" key={`${index}-${title}`}>
            <legend className="zn-ordrev__piece">
              <span className="zn-ordthumb zn-ordthumb--46" aria-hidden="true">
                <PieceIcon size={23} />
              </span>
              <span className="zn-ordrev__piece-title">{title}</span>
            </legend>
            <div className="zn-ordstars">
              {[1, 2, 3, 4, 5].map((stars) => (
                <label className="zn-ordstar" key={stars}>
                  <input type="radio" name={`rating.${index}`} value={stars} required />
                  <span className="sr-only">{`${ratingWords[stars] ?? ''} — ${stars} از ۵`}</span>
                  <StarIcon />
                </label>
              ))}
            </div>
            <span className="zn-ordstars__word" aria-hidden="true">
              <span>امتیاز خود را انتخاب کنید</span>
              {[1, 2, 3, 4, 5].map((stars) => (
                <span key={stars} data-rating={stars}>
                  {ratingWords[stars]}
                </span>
              ))}
            </span>
          </fieldset>
        ))}

        <div className="zn-ordrev__card">
          <label className="zn-ordfield__label zn-ordrev__label" htmlFor="review-body">
            نظر شما
          </label>
          <textarea
            className="zn-ordtextarea zn-ordtextarea--review"
            id="review-body"
            name="body"
            rows={4}
            maxLength={600}
            placeholder="از کیفیت ساخت، رنگ و بسته‌بندی بنویسید"
          />
          <div className="zn-ordtags">
            {tags.map((tag) => (
              <label className="zn-ordtag" key={tag.value}>
                <input type="checkbox" name="tags" value={tag.value} />
                {tag.label}
              </label>
            ))}
          </div>
          <label className="zn-ordanon">
            <input type="checkbox" name="anonymous" />
            <span className="zn-ordcheck" aria-hidden="true">
              <TickIcon />
            </span>
            <span className="zn-ordanon__label">نظرم بدون نام منتشر شود</span>
          </label>
        </div>
      </div>

      <Refusal state={state} />

      <div className="zn-orddock">
        <button
          className="zn-orddock__submit zn-orddock__submit--review"
          type="submit"
          disabled={pending}
        >
          ثبت نظر
        </button>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Support                                                                    */
/* -------------------------------------------------------------------------- */

export function SupportComposer({
  code,
  asks,
}: {
  readonly code: string;
  readonly asks: readonly string[];
}) {
  const [state, action, pending] = useActionState(submitOrderMessage, ORDER_FORM_IDLE);

  return (
    <>
      <div className="zn-ordasks">
        {asks.map((ask) => (
          <form action={action} key={ask}>
            <input type="hidden" name="code" value={code} />
            <input type="hidden" name="body" value={ask} />
            <button className="zn-ordask" type="submit" disabled={pending}>
              {ask}
            </button>
          </form>
        ))}
      </div>
      <Refusal state={state} />
      <form className="zn-ordcompose" action={action}>
        <input type="hidden" name="code" value={code} />
        <label className="sr-only" htmlFor="support-body">
          پیام شما
        </label>
        <input
          className="zn-ordcompose__input"
          id="support-body"
          name="body"
          maxLength={500}
          required
          autoComplete="off"
          placeholder="پیام خود را بنویسید"
        />
        <button
          className="zn-ordcompose__send"
          type="submit"
          aria-label="ارسال پیام"
          disabled={pending}
        >
          <SendIcon />
        </button>
      </form>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* One-tap requests                                                           */
/* -------------------------------------------------------------------------- */

export function PayInstalmentButton({
  code,
  walletHref,
}: {
  readonly code: string;
  readonly walletHref: string;
}) {
  const [state, action, pending] = useActionState(submitInstalmentPayment, ORDER_FORM_IDLE);

  return (
    <form className="zn-ordinst__form" action={action}>
      <input type="hidden" name="code" value={code} />
      <button className="zn-ordbtn zn-ordbtn--gold zn-ordbtn--pay" type="submit" disabled={pending}>
        پرداخت قسط جاری از کیف پول
      </button>
      {state.status === 'error' ? (
        <p className="zn-ordhint zn-ordhint--error zn-ordhint--flush" role="alert">
          {state.message} <Link href={walletHref}>شارژ کیف پول</Link>
        </p>
      ) : null}
    </form>
  );
}

/**
 * «خرید دوباره». A row in the detail's action list, or the gold button on a
 * card; either way a POST, because it changes the basket.
 */
export function ReorderButton({
  code,
  variant,
  children,
}: {
  readonly code: string;
  readonly variant: 'row' | 'card';
  readonly children: ReactNode;
}) {
  const [state, action, pending] = useActionState(submitReorder, ORDER_FORM_IDLE);

  return (
    <form
      action={action}
      className={variant === 'card' ? 'zn-ordreorder' : 'zn-ordreorder zn-ordreorder--row'}
    >
      <input type="hidden" name="code" value={code} />
      {variant === 'card' ? (
        <button className="zn-ordbtn zn-ordbtn--gold" type="submit" disabled={pending}>
          {children}
        </button>
      ) : (
        <button className="zn-ordaction" type="submit" disabled={pending}>
          <span className="zn-ordaction__icon">
            <ActionIcon name="again" />
          </span>
          <span className="zn-ordaction__label">{children}</span>
          <span className="zn-ordaction__chevron">
            <ChevronStartIcon />
          </span>
        </button>
      )}
      {state.status === 'error' ? (
        <p className="zn-ordhint zn-ordhint--error zn-ordhint--flush" role="alert">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
