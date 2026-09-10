'use client';

import { useId, useRef, useState, type KeyboardEvent, type TouchEvent } from 'react';
import type { ProductDetail } from '@sharghigold/contracts';

import { MediaPlaceholder } from '@/components/media-placeholder';
import { persianCount, weightLabel } from '@/lib/product-view';

/** How far a finger must travel before it counts as a swipe rather than a tap. */
const SWIPE_THRESHOLD_PX = 40;

/**
 * The product gallery: a track of frames, a thumbnail strip, and a counter.
 *
 * Built as a tab list. The thumbnails select which frame shows, which is
 * exactly what tabs do, and it brings the keyboard behaviour for free — arrows
 * move between frames, Home and End jump to the ends, and Tab leaves the strip
 * instead of walking through every photograph.
 *
 * The canvas moves the track with a transform and offers a swipe. Both are
 * kept. What is added is the keyboard: a gallery you can only operate with a
 * finger is a gallery a lot of people cannot operate.
 */
export function ProductGallery({ product }: { readonly product: ProductDetail }) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const baseId = useId();

  const frames = product.media;
  const tabId = (position: number) => `${baseId}-thumb-${position}`;
  const panelId = (position: number) => `${baseId}-frame-${position}`;

  const show = (next: number) => setIndex(Math.min(frames.length - 1, Math.max(0, next)));

  const focusThumb = (next: number) => {
    const clamped = (next + frames.length) % frames.length;
    setIndex(clamped);
    stripRef.current?.querySelector<HTMLButtonElement>(`#${CSS.escape(tabId(clamped))}`)?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    switch (event.key) {
      // The strip reads right-to-left, so ArrowLeft advances.
      case 'ArrowLeft':
        event.preventDefault();
        focusThumb(index + 1);
        break;
      case 'ArrowRight':
        event.preventDefault();
        focusThumb(index - 1);
        break;
      case 'Home':
        event.preventDefault();
        focusThumb(0);
        break;
      case 'End':
        event.preventDefault();
        focusThumb(frames.length - 1);
        break;
      default:
        break;
    }
  };

  const onTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const onTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const start = touchStartX.current;
    const end = event.changedTouches[0]?.clientX;
    touchStartX.current = null;

    if (start === null || end === undefined) return;

    const travelled = end - start;
    if (Math.abs(travelled) < SWIPE_THRESHOLD_PX) return;

    // Dragging toward the end of the line in RTL means «next».
    show(index + (travelled > 0 ? 1 : -1));
  };

  return (
    <section className="zn-gallery" aria-label="تصاویر محصول">
      <div className="zn-gallery__window" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div
          className="zn-gallery__track"
          style={{ transform: `translateX(${String(index * 100)}%)` }}
        >
          {frames.map((frame, position) => (
            <div
              className="zn-gallery__frame"
              key={frame.id}
              id={panelId(position)}
              role="tabpanel"
              aria-labelledby={tabId(position)}
              // Frames off screen are still in the flow of the track, so they
              // are hidden from assistive technology rather than unmounted.
              aria-hidden={position !== index}
            >
              <MediaPlaceholder label={frame.alt} />
            </div>
          ))}
        </div>

        <div className="zn-gallery__badges">
          {product.installmentEligible ? (
            <span className="zn-gallery__badge zn-gallery__badge--gold">قابل خرید اقساطی</span>
          ) : null}
          <span className="zn-gallery__badge">
            {persianCount(product.karat)} عیار · {weightLabel(product.weightMilligrams)}
          </span>
        </div>

        <span className="zn-gallery__count">
          {persianCount(index + 1)} / {persianCount(frames.length)}
        </span>
      </div>

      <div className="zn-gallery__thumbs" role="tablist" aria-label="انتخاب تصویر" ref={stripRef}>
        {frames.map((frame, position) => (
          <button
            key={frame.id}
            id={tabId(position)}
            className={`zn-gallery__thumb${position === index ? ' zn-gallery__thumb--on' : ''}`}
            type="button"
            role="tab"
            aria-selected={position === index}
            aria-controls={panelId(position)}
            // Roving tabindex: one stop for the strip, then arrows.
            tabIndex={position === index ? 0 : -1}
            onClick={() => show(position)}
            onKeyDown={onKeyDown}
          >
            <span className="sr-only">{frame.alt}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
