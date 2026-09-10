'use client';

import Link from 'next/link';
import { useActionState, useId, useState } from 'react';
import { REVIEW_BODY_MAX, type ReviewAspect } from '@sharghigold/contracts';

import { StarIcon, TickIcon } from '@/components/icons';
import { MediaPlaceholder } from '@/components/media-placeholder';
import { ASPECT_LABEL, persianCount, RATING_WORDS } from '@/lib/product-view';
import { submitReview } from '@/app/products/[slug]/reviews/new/actions';
import { EMPTY_DRAFT, type WriteState } from '@/app/products/[slug]/reviews/new/state';

const STARS = [1, 2, 3, 4, 5] as const;
const ASPECTS: readonly ReviewAspect[] = ['build-quality', 'photo-match', 'value'];

/**
 * Writing a review.
 *
 * A real `<form>` posting to a Server Action, so it submits without
 * JavaScript. The star pickers are radio groups behind the drawings — a
 * rating is one of five, which is what a radio group is, and building it that
 * way means the keyboard, the screen-reader announcement and the form payload
 * all work without a line of code for any of them. The canvas uses buttons and
 * gets none of the three.
 *
 * The score shown beside the stars is local state, because it changes as you
 * point at them; everything that decides whether the review is publishable is
 * decided on the server.
 */
export function ReviewForm({
  slug,
  productTitle,
  mediaAlt,
}: {
  readonly slug: string;
  readonly productTitle: string;
  readonly mediaAlt: string;
}) {
  const [state, action, pending] = useActionState<WriteState, FormData>(submitReview, {
    status: 'idle',
    draft: EMPTY_DRAFT,
  });

  const draft = state.status === 'accepted' ? EMPTY_DRAFT : state.draft;
  const [stars, setStars] = useState(draft.stars);
  const baseId = useId();

  if (state.status === 'accepted') {
    return (
      <section className="zn-written">
        <span className="zn-written__tick" aria-hidden="true">
          <TickIcon size={30} strokeWidth={2.2} />
        </span>
        <h1 className="zn-written__title">دیدگاه شما ثبت شد</h1>
        <p className="zn-written__body">
          پس از بررسی کارشناسان، حداکثر تا ۲۴ ساعت آینده در صفحه محصول منتشر می‌شود. نتیجه با پیامک
          به شما اطلاع داده می‌شود.
        </p>
        <div className="zn-written__actions">
          <Link className="zn-written__primary" href={`/products/${slug}/reviews`}>
            دیدن دیدگاه‌های دیگران
          </Link>
          <Link className="zn-written__secondary" href={`/products/${slug}`}>
            بازگشت به صفحه محصول
          </Link>
        </div>
      </section>
    );
  }

  const failed = state.status === 'invalid' || state.status === 'unavailable';

  return (
    <form className="zn-write" action={action}>
      <input type="hidden" name="slug" value={slug} />

      <section className="zn-subhead">
        <h1 className="zn-subhead__title">ثبت دیدگاه</h1>
        <p className="zn-subhead__body">
          تجربه شما به خریداران بعدی کمک می‌کند. دیدگاه‌ها پس از بررسی، حداکثر تا ۲۴ ساعت منتشر
          می‌شوند.
        </p>

        <div className="zn-write__product">
          <span className="zn-write__thumb">
            <MediaPlaceholder label={mediaAlt} />
          </span>
          <span className="zn-write__producttext">
            <span className="zn-write__productname">{productTitle}</span>
            <span className="zn-write__verified">خرید تأییدشده</span>
          </span>
        </div>
      </section>

      <fieldset className="zn-write__block zn-write__block--near">
        <legend className="zn-write__legend">
          امتیاز کلی شما<span className="zn-write__req"> *</span>
        </legend>

        <div className="zn-write__stars">
          {STARS.map((star) => (
            <label
              className="zn-write__star"
              key={star}
              aria-label={`امتیاز ${persianCount(star)} از ۵`}
            >
              <input
                className="sr-only"
                type="radio"
                name="stars"
                value={star}
                checked={stars === star}
                onChange={() => setStars(star)}
              />
              <StarIcon size={30} filled={star <= stars} strokeWidth={1.4} />
            </label>
          ))}
          <span className="zn-write__word">{RATING_WORDS[stars]}</span>
        </div>
      </fieldset>

      <section className="zn-write__block">
        <p className="zn-write__label zn-write__label--wide">امتیاز جزئی</p>

        <div className="zn-write__criteria">
          {ASPECTS.map((aspect) => (
            <AspectPicker aspect={aspect} initial={draft.aspects[aspect] ?? 0} key={aspect} />
          ))}
        </div>
      </section>

      <section className="zn-write__block">
        <label className="zn-write__label" htmlFor={`${baseId}-title`}>
          عنوان دیدگاه
        </label>
        <input
          className="zn-write__input"
          id={`${baseId}-title`}
          name="title"
          type="text"
          maxLength={80}
          defaultValue={draft.title}
          placeholder="مثلاً: دقیقاً مطابق تصویر بود"
        />
      </section>

      <BodyField id={`${baseId}-body`} initial={draft.body} />

      <section className="zn-write__block zn-write__block--near">
        <p className="zn-write__label zn-write__label--tight">افزودن عکس</p>
        <p className="zn-write__hint">عکس واقعی کالا، دیدگاه شما را چند برابر مفیدتر می‌کند.</p>

        {/* Rendered, disabled and honest about it. Uploads need a store and a
            virus scan, and neither exists; a slot that silently accepts a file
            and drops it is worse than one that says it is not ready. */}
        <div className="zn-write__slots" aria-hidden="true">
          {[0, 1, 2].map((slot) => (
            <span className="zn-write__slot" key={slot}>
              <MediaPlaceholder label="به‌زودی" />
            </span>
          ))}
        </div>
      </section>

      <section className="zn-write__block">
        <label className="zn-write__rules">
          <input
            className="sr-only zn-write__check"
            type="checkbox"
            name="acceptsPolicy"
            defaultChecked={draft.acceptsPolicy}
            required
          />
          <span className="zn-write__box" aria-hidden="true">
            <TickIcon size={14} strokeWidth={2.6} />
          </span>
          <span className="zn-write__rulestext">
            قواعد انتشار دیدگاه را می‌پذیرم: بدون توهین، بدون اطلاعات تماس و بدون تبلیغ فروشنده
            دیگر.
          </span>
        </label>
      </section>

      <section className="zn-write__block zn-write__block--submit">
        {failed ? (
          <p className="zn-write__error" role="alert">
            {state.status === 'invalid'
              ? state.message
              : 'ثبت دیدگاه هنوز فعال نیست. به‌زودی می‌توانید تجربه‌تان را منتشر کنید.'}
          </p>
        ) : null}

        <button className="zn-write__submit" type="submit" disabled={pending}>
          {pending ? 'در حال ارسال…' : 'ارسال دیدگاه'}
        </button>

        <p className="zn-write__privacy">
          نام شما به‌صورت کوتاه‌شده نمایش داده می‌شود و شماره تماس شما هرگز منتشر نمی‌شود.
        </p>
      </section>
    </form>
  );
}

function AspectPicker({
  aspect,
  initial,
}: {
  readonly aspect: ReviewAspect;
  readonly initial: number;
}) {
  const [stars, setStars] = useState(initial);

  return (
    <fieldset className="zn-write__criterion">
      <legend className="zn-write__criterionlabel">{ASPECT_LABEL[aspect]}</legend>

      <div className="zn-write__criterionstars">
        {STARS.map((star) => (
          <label
            className="zn-write__ministar"
            key={star}
            aria-label={`${ASPECT_LABEL[aspect]}: ${persianCount(star)} از ۵`}
          >
            <input
              className="sr-only"
              type="radio"
              name={`aspect.${aspect}`}
              value={star}
              checked={stars === star}
              onChange={() => setStars(star)}
            />
            <StarIcon size={20} filled={star <= stars} strokeWidth={1.5} />
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function BodyField({ id, initial }: { readonly id: string; readonly initial: string }) {
  const [length, setLength] = useState(initial.length);

  return (
    <section className="zn-write__block zn-write__block--near">
      <label className="zn-write__label" htmlFor={id}>
        متن دیدگاه<span className="zn-write__req"> *</span>
      </label>

      <textarea
        className="zn-write__textarea"
        id={id}
        name="body"
        rows={5}
        maxLength={REVIEW_BODY_MAX}
        required
        defaultValue={initial}
        placeholder="از کیفیت ساخت، وزن، تطابق با تصویر و روند ارسال بنویسید."
        onChange={(event) => setLength(event.target.value.length)}
      />

      <p className="zn-write__count" aria-live="off">
        {persianCount(length)} از {persianCount(REVIEW_BODY_MAX)} نویسه
      </p>
    </section>
  );
}
