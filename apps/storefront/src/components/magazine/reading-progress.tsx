'use client';

import { useEffect, useState } from 'react';

/**
 * The gold line under an article's header: how far down the page the reader is.
 *
 * Decorative — the scroll bar already says this — so it is hidden from
 * assistive technology. The listener is passive and batched to one update per
 * frame; scroll events fire far more often than a screen can repaint.
 */
export function ReadingProgress() {
  const [share, setShare] = useState(0);

  useEffect(() => {
    let frame = 0;

    const measure = () => {
      frame = 0;
      const root = document.documentElement;
      const range = root.scrollHeight - root.clientHeight;
      setShare(range > 0 ? Math.min(1, root.scrollTop / range) : 0);
    };

    const onScroll = () => {
      if (frame === 0) frame = requestAnimationFrame(measure);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame !== 0) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="zn-magprogress" aria-hidden="true">
      <div className="zn-magprogress__bar" style={{ inlineSize: `${(share * 100).toFixed(1)}%` }} />
    </div>
  );
}
