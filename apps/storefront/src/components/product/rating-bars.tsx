import type { RatingSummary } from '@sharghigold/contracts';

import { StarIcon } from '@/components/icons';
import { persianCount, persianDecimal, ratingPercent } from '@/lib/product-view';

/**
 * The mean, and how the reviews are distributed across the five ratings.
 *
 * The bar widths are derived from the counts rather than sent as percentages,
 * so a bar cannot disagree with the number beside it. Each bar is a
 * `progressbar` with its own label, because a coloured stripe with no text is
 * nothing at all to a screen reader.
 */
export function RatingBars({
  rating,
  showStars = false,
  showPercent = false,
}: {
  readonly rating: RatingSummary;
  /** The row of five stars under the mean, on the reviews page. */
  readonly showStars?: boolean;
  /** The percentage printed after each bar, on the reviews page. */
  readonly showPercent?: boolean;
}) {
  return (
    <div className={`zn-ratings${showStars ? ' zn-ratings--large' : ''}`}>
      <div className="zn-ratings__mean">
        <span className="zn-ratings__score">{persianDecimal(rating.average)}</span>

        {showStars ? (
          <span className="zn-ratings__stars" aria-hidden="true">
            {[1, 2, 3, 4, 5].map((star) => (
              <StarIcon key={star} size={11} filled={star <= Math.round(Number(rating.average))} />
            ))}
          </span>
        ) : null}

        <span className="zn-ratings__count">از {persianCount(rating.total)} نظر</span>
      </div>

      <div className="zn-ratings__bars">
        {rating.buckets.map((bucket) => {
          const percent = ratingPercent(bucket.count, rating.total);

          return (
            <div className="zn-ratings__row" key={bucket.stars}>
              <span className="zn-ratings__star">{persianCount(bucket.stars)}</span>

              <span
                className="zn-ratings__track"
                role="progressbar"
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${persianCount(bucket.stars)} ستاره: ${persianCount(bucket.count)} دیدگاه`}
              >
                <span className="zn-ratings__fill" style={{ inlineSize: `${String(percent)}%` }} />
              </span>

              {showPercent ? (
                <span className="zn-ratings__percent">{persianCount(percent)}٪</span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
