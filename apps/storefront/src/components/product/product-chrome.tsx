'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { ArrowRightIcon, HeartIcon, ShareIcon } from '@/components/icons';

/**
 * The bar at the top of every product surface: back, title, share, favourite.
 *
 * On the product page itself the title only appears once the gallery has
 * scrolled away, because until then the real heading is on screen and a second
 * copy of it is noise. On the sub-pages there is nothing above the fold to
 * name the screen, so it is shown from the start — the canvas fades it in
 * everywhere, which leaves those pages briefly untitled.
 *
 * Back is a real link, not `history.back()`. A customer can arrive here from a
 * search result with no history to go back to, and «back» that does nothing is
 * worse than «back» that goes somewhere sensible.
 */
export function ProductChrome({
  title,
  backHref,
  revealTitleOnScroll = false,
}: {
  readonly title: string;
  readonly backHref: string;
  readonly revealTitleOnScroll?: boolean;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [favourite, setFavourite] = useState(false);

  useEffect(() => {
    if (!revealTitleOnScroll) return undefined;

    // Passive: this listener never calls preventDefault, and saying so lets the
    // browser scroll without waiting to find out.
    const onScroll = () => setScrolled(window.scrollY > 260);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => window.removeEventListener('scroll', onScroll);
  }, [revealTitleOnScroll]);

  const titleShown = !revealTitleOnScroll || scrolled;

  return (
    <header className="zn-pdphead">
      <Link className="zn-pdphead__btn" href={backHref} aria-label="بازگشت">
        <ArrowRightIcon size={20} />
      </Link>

      {/* aria-hidden while faded out: it is a duplicate of the h1 below, and a
          screen reader should not meet the title twice before the content. */}
      <span
        className={`zn-pdphead__title${titleShown ? ' zn-pdphead__title--on' : ''}`}
        aria-hidden={!titleShown}
      >
        {title}
      </span>

      <button className="zn-pdphead__btn" type="button" aria-label="اشتراک‌گذاری">
        <ShareIcon />
      </button>

      <button
        className={`zn-pdphead__btn${favourite ? ' zn-pdphead__btn--fav' : ''}`}
        type="button"
        aria-pressed={favourite}
        aria-label="افزودن به علاقه‌مندی"
        onClick={() => setFavourite((on) => !on)}
      >
        <HeartIcon filled={favourite} />
      </button>
    </header>
  );
}
