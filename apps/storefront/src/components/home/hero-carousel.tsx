'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { toPersianDigits } from '@sharghigold/ui';

export interface HeroSlide {
  readonly eyebrow: string;
  /** Split across lines exactly as the design sets it. */
  readonly headline: readonly string[];
  readonly note: string;
  readonly cta: string;
  readonly href: string;
}

/**
 * The hero carousel.
 *
 * A client component, because it moves. Three things it does that the design
 * canvas does not:
 *
 *   - It stops. Autoplay pauses while the section has focus or the pointer is
 *     over it, and never starts at all under `prefers-reduced-motion`. A hero
 *     that keeps sliding out from under someone reading it is a common and
 *     entirely avoidable accessibility failure.
 *   - It can be operated from the keyboard. The dots are real buttons with
 *     names, and the arrow keys move between slides.
 *   - It announces itself honestly: the slide container is a labelled group
 *     with `aria-roledescription`, and off-screen slides are `inert`, so a
 *     keyboard user cannot tab into a slide they cannot see.
 *
 * All three slides render server-side, so the copy and its links are in the
 * HTML whether or not this ever hydrates.
 */
export function HeroCarousel({
  slides,
  autoplay = true,
}: {
  readonly slides: readonly HeroSlide[];
  readonly autoplay?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = useCallback(
    (next: number) => {
      setIndex(((next % slides.length) + slides.length) % slides.length);
    },
    [slides.length],
  );

  useEffect(() => {
    if (!autoplay || paused || slides.length < 2) {
      return;
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduced.matches) {
      return;
    }

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, 5_000);

    return () => {
      window.clearInterval(timer);
    };
  }, [autoplay, paused, slides.length]);

  return (
    <section
      className="zn-hero"
      aria-roledescription="کاروسل"
      aria-label="پیشنهادهای ویژه"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onKeyDown={(event) => {
        // In RTL the start arrow is ArrowRight, so it moves to the previous
        // slide — matching the direction the track actually travels.
        if (event.key === 'ArrowRight') {
          go(index - 1);
        } else if (event.key === 'ArrowLeft') {
          go(index + 1);
        }
      }}
    >
      <div className="zn-hero__track" style={{ transform: `translateX(${index * 100}%)` }}>
        {slides.map((slide, position) => (
          <div
            className="zn-hero__slide"
            key={slide.href}
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- inert is a real attribute in React 19
            inert={position === index ? undefined : true}
            aria-roledescription="اسلاید"
            aria-label={`${toPersianDigits(position + 1)} از ${toPersianDigits(slides.length)}`}
          >
            <div className="zn-hero__copy">
              <span className="zn-hero__eyebrow">{slide.eyebrow}</span>
              <p className="zn-hero__headline">
                {slide.headline.map((line, lineIndex) => (
                  // eslint-disable-next-line react/no-array-index-key -- fixed positional lines
                  <span className="zn-hero__line" key={lineIndex}>
                    {line}
                  </span>
                ))}
              </p>
              <span className="zn-hero__note">{slide.note}</span>
              <Link className="zn-hero__cta" href={slide.href}>
                {slide.cta}
              </Link>
            </div>
            <div className="zn-hero__media" aria-hidden="true" />
          </div>
        ))}
      </div>

      <div className="zn-hero__dots">
        {slides.map((slide, position) => (
          <button
            className={`zn-hero__dot${position === index ? ' zn-hero__dot--on' : ''}`}
            key={slide.href}
            type="button"
            aria-label={`اسلاید ${toPersianDigits(position + 1)}`}
            aria-current={position === index ? 'true' : undefined}
            onClick={() => go(position)}
          />
        ))}
      </div>
    </section>
  );
}
