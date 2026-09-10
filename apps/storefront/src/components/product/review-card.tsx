import type { ProductReview } from '@sharghigold/contracts';

import { StarIcon } from '@/components/icons';
import { HelpfulButton } from '@/components/product/helpful-button';
import { MediaPlaceholder } from '@/components/media-placeholder';
import { persianCount, relativeTime } from '@/lib/product-view';

/**
 * One review.
 *
 * `detailed` is what the reviews page shows: the title, the photographs, the
 * «useful» control and the shop's reply. The product page shows the short
 * form, because a page that is mostly reviews is not a product page.
 *
 * The date is rendered from an ISO instant against a `now` the server passes
 * in, rather than from the browser's clock — one instant for the whole render,
 * and no phrase that goes stale in the database.
 *
 * The body is plain text and React escapes it. That is the XSS defence; the
 * length and character bounds in the contract are hygiene, not a substitute.
 */
export function ReviewCard({
  review,
  now,
  detailed = false,
}: {
  readonly review: ProductReview;
  readonly now: Date;
  readonly detailed?: boolean;
}) {
  const initial = [...review.authorDisplayName][0] ?? '؟';

  return (
    <article className="zn-review" aria-label={`دیدگاه ${review.authorDisplayName}`}>
      <div className="zn-review__head">
        <span className="zn-review__avatar" aria-hidden="true">
          {initial}
        </span>

        <span className="zn-review__who">
          <span className="zn-review__name">{review.authorDisplayName}</span>
          {detailed && review.verifiedPurchase ? (
            <span className="zn-review__verified">خرید تأییدشده</span>
          ) : null}
        </span>

        <span className="zn-review__score">
          <StarIcon size={12} />
          {persianCount(review.stars)}
          <span className="sr-only">از ۵</span>
        </span>
      </div>

      {detailed && review.title !== null ? (
        <p className="zn-review__title">{review.title}</p>
      ) : null}

      <p className="zn-review__body">{review.body}</p>

      {detailed && review.photos.length > 0 ? (
        <ul className="zn-review__photos" aria-label="عکس‌های خریدار">
          {review.photos.map((photo) => (
            <li className="zn-review__photo" key={photo.id}>
              <MediaPlaceholder label="عکس خریدار" />
            </li>
          ))}
        </ul>
      ) : null}

      {detailed ? (
        <div className="zn-review__foot">
          <span className="zn-review__date">{relativeTime(review.publishedAt, now)}</span>
          <HelpfulButton count={review.helpfulCount} />
        </div>
      ) : (
        <p className="zn-review__meta">
          {review.verifiedPurchase ? 'خرید تأییدشده · ' : ''}
          {relativeTime(review.publishedAt, now)}
        </p>
      )}

      {detailed && review.sellerReply !== null ? (
        <div className="zn-review__reply">
          <span className="zn-review__replyhead">پاسخ زرنما</span>
          <p className="zn-review__replybody">{review.sellerReply.body}</p>
        </div>
      ) : null}
    </article>
  );
}
