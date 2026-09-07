import type { ReactNode } from 'react';

/**
 * A run of short specifications separated by a middle dot — the
 * «۱۸ عیار · ۱٫۸ گرم» pattern the design uses on every product card.
 *
 * Why this is a component rather than a template string:
 *
 * `·` is a bidi-neutral character. Placed inside a single RTL text run between
 * two numeric segments, the Unicode bidirectional algorithm resolves its
 * direction from its surroundings, and it renders on the wrong side of the
 * number. «۱۸ عیار · ۱٫۸ گرم» comes out reading «۱۸۰ عیار», which a customer
 * would take as a different purity.
 *
 * Giving each specification its own element, with the separator as a sibling
 * rather than part of the text, makes bidi resolution happen per segment. The
 * separator is aria-hidden because it is punctuation, not content — a screen
 * reader should announce the items, not the dots between them.
 */
export function SpecList({
  items,
  className,
}: {
  readonly items: readonly ReactNode[];
  readonly className?: string;
}): React.ReactElement {
  const visible = items.filter((item) => item !== null && item !== undefined && item !== '');

  return (
    <span className={className} style={{ display: 'inline-flex', gap: 'var(--space-2)' }}>
      {visible.map((item, index) => (
        // eslint-disable-next-line react/no-array-index-key -- specs are a fixed positional list
        <span key={index} style={{ display: 'inline-flex', gap: 'var(--space-2)' }}>
          {index > 0 ? <span aria-hidden="true">·</span> : null}
          <span>{item}</span>
        </span>
      ))}
    </span>
  );
}
