/**
 * Geometry for the catalogue marks.
 *
 * The design canvas does not draw these illustrations by hand — it builds them
 * from a small set of generators, so a coin at 5.4 units and a coin at 9.2 are
 * the same drawing at two radii. Those generators are ported here verbatim
 * rather than their output being flattened into literal path strings, for two
 * reasons: the arithmetic *is* the design (a hand-copied `17.444871...` is a
 * transcription waiting to drift), and a generator can be unit-tested where a
 * wall of path data cannot.
 *
 * Every fill is a colour token, never a hex value, so the whole set re-tints
 * with the palette.
 *
 * Pure module: no React, no DOM. `registry.ts` composes these into named
 * marks; `mark.tsx` renders them.
 */

/** One filled path in a mark. */
export interface MarkPath {
  /** SVG path data, in the shared `0 0 24 24` viewBox. */
  readonly d: string;
  /** A `var(--…)` colour token. */
  readonly fill: string;
  /** Even-odd winding, which is how the ring shapes get their hole. */
  readonly evenOdd?: boolean;
  /** Applied to a wrapping `<g>`, for the shapes drawn around the origin. */
  readonly transform?: string;
}

/* -------------------------------------------------------------------------- */
/* Palette                                                                    */
/* -------------------------------------------------------------------------- */

export const GOLD_600 = 'var(--gold-600)';
export const GOLD_500 = 'var(--gold-500)';
export const GOLD_400 = 'var(--gold-400)';
export const GOLD_300 = 'var(--gold-300)';
export const GOLD_200 = 'var(--gold-200)';
export const GOLD_50 = 'var(--gold-50)';
export const TEAL_700 = 'var(--teal-700)';
export const TEAL_500 = 'var(--teal-500)';

/* -------------------------------------------------------------------------- */
/* Primitives                                                                 */
/* -------------------------------------------------------------------------- */

/** A circle, as two arcs, so it can be combined into an even-odd compound. */
export const circle = (x: number, y: number, r: number): string =>
  `M${x} ${y - r}a${r} ${r} 0 1 0 0 ${2 * r}a${r} ${r} 0 1 0 0 ${-2 * r}Z`;

/** An annulus: outer circle plus inner circle, filled even-odd. */
export const ring = (x: number, y: number, outer: number, inner: number): string =>
  circle(x, y, outer) + circle(x, y, inner);

/** An ellipse, used for the elliptical tops of stacked coins. */
export const ellipse = (x: number, y: number, rx: number, ry: number): string =>
  `M${x - rx} ${y}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0Z`;

/** A diamond of half-diagonal `s`. */
export const diamond = (x: number, y: number, s: number, fill: string): MarkPath => ({
  d: `M${x - s} ${y} ${x} ${y - s} ${x + s} ${y} ${x} ${y + s}Z`,
  fill,
});

/** A teardrop, drawn at the origin and positioned by transform. */
const TEARDROP = 'M0 0c-2.6 3.5-3.5 5.4-3.5 6.6a3.5 3.5 0 0 0 7 0c0-1.2-.9-3.1-3.5-6.6Z';

/** A heart, drawn at the origin and positioned by transform. */
const HEART =
  'M0 7.6C-5.6 3.4-7.6.8-7.6-1.8A4 4 0 0 1 0-4.2A4 4 0 0 1 7.6-1.8C7.6.8 5.6 3.4 0 7.6Z';

export const teardrop = (x: number, y: number, scale: number, fill: string): MarkPath => ({
  d: TEARDROP,
  fill,
  transform: `translate(${x} ${y}) scale(${scale})`,
});

export const heart = (x: number, y: number, scale: number, fill: string): MarkPath => ({
  d: HEART,
  fill,
  transform: `translate(${x} ${y}) scale(${scale})`,
});

/** The scooped collar that every necklace mark hangs from. */
export const COLLAR =
  'M2.6 3.2h2.6c0 4.2 3 7.4 6.8 7.4s6.8-3.2 6.8-7.4h2.6c0 5.6-4.2 10-9.4 10S2.6 8.8 2.6 3.2Z';

/** A point on the circle centred at (12, 12) — used to space bangle stones. */
export const pointAt = (degrees: number, radius: number): readonly [number, number] => [
  12 + radius * Math.cos((degrees * Math.PI) / 180),
  12 + radius * Math.sin((degrees * Math.PI) / 180),
];

/* -------------------------------------------------------------------------- */
/* Composite shapes                                                           */
/* -------------------------------------------------------------------------- */

/** A coin: rim, face, and centre punch. */
export const coin = (x: number, y: number, r: number): readonly MarkPath[] => [
  { d: circle(x, y, r), fill: GOLD_600 },
  { d: circle(x, y, r * 0.74), fill: GOLD_400 },
  { d: circle(x, y, r * 0.38), fill: TEAL_700 },
];

/** A bullion bar in trapezoidal projection: body plus top face. */
export const ingot = (x: number, y: number, w: number, h: number): readonly MarkPath[] => [
  {
    d: `M${x - w} ${y} ${x + w} ${y} ${x + w * 0.8} ${y + h} ${x - w * 0.8} ${y + h}Z`,
    fill: GOLD_600,
  },
  {
    d: `M${x - w * 0.8} ${y - h * 0.55} ${x + w * 0.8} ${y - h * 0.55} ${x + w} ${y} ${x - w} ${y}Z`,
    fill: GOLD_300,
  },
];

/** A gift box: body, lid band, and ribbon. */
export const giftBox = (): readonly MarkPath[] => [
  { d: 'M3.6 11.6h16.8v8.4a1.6 1.6 0 0 1-1.6 1.6H5.2a1.6 1.6 0 0 1-1.6-1.6Z', fill: GOLD_600 },
  { d: 'M2.4 7.8h19.2v3.8H2.4Z', fill: GOLD_500 },
  { d: 'M10.6 7.8h2.8v13.8h-2.8Z', fill: GOLD_200 },
];

/** A wall calendar: leaf, header band, and two hanging rings. */
export const calendar = (): readonly MarkPath[] => [
  {
    d: 'M3.4 5.4h17.2a1.6 1.6 0 0 1 1.6 1.6v12.4a1.6 1.6 0 0 1-1.6 1.6H3.4a1.6 1.6 0 0 1-1.6-1.6V7a1.6 1.6 0 0 1 1.6-1.6Z',
    fill: GOLD_600,
  },
  {
    d: 'M1.8 7a1.6 1.6 0 0 1 1.6-1.6h17.2A1.6 1.6 0 0 1 22.2 7v3.4H1.8Z',
    fill: GOLD_500,
  },
  { d: 'M6 2.4h2.2v4.6H6ZM15.8 2.4H18V7h-2.2Z', fill: TEAL_700 },
];

/** A dot matrix filling the calendar leaf — the instalment-count marks. */
export const dotGrid = (columns: number, rows: number, fill: string): readonly MarkPath[] => {
  const out: MarkPath[] = [];
  const x0 = 4.4;
  const y0 = 12.2;
  const w = 15.2 / columns;
  const h = 6.8 / rows;

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      out.push({
        d: circle(x0 + w * column + w / 2, y0 + h * row + h / 2, Math.min(w, h) * 0.3),
        fill,
      });
    }
  }

  return out;
};

/** A balance scale carrying `weights` stones — one per weight band. */
export const balance = (weights: 1 | 2 | 3): readonly MarkPath[] => {
  const out: MarkPath[] = [
    { d: 'M11.1 4.6h1.8v15h-1.8Z', fill: GOLD_600 },
    { d: 'M6.8 19.4h10.4v2.2H6.8Z', fill: GOLD_600 },
    { d: 'M3.2 8.2h17.6v1.9H3.2Z', fill: GOLD_500 },
    { d: 'M3.8 10.4 1.1 15.8a3.1 3.1 0 0 0 5.4 0Z', fill: GOLD_400 },
    { d: 'M20.2 10.4 17.5 15.8a3.1 3.1 0 0 0 5.4 0Z', fill: GOLD_400 },
  ];

  const positions = weights === 1 ? [12] : weights === 2 ? [10.2, 13.8] : [8.6, 12, 15.4];
  for (const x of positions) out.push({ d: circle(x, 6.2, 1.7), fill: TEAL_700 });

  return out;
};

/** A stack of `height` coins seen in perspective — the budget-band marks. */
export const coinStack = (height: number): readonly MarkPath[] => {
  const out: MarkPath[] = [];

  for (let k = 0; k < height; k += 1) {
    const y = 18.6 - k * 4.7;
    out.push({ d: `M4.6 ${y - 2.4}v2.4a7.4 2.4 0 0 0 14.8 0v-2.4Z`, fill: GOLD_600 });
    out.push({ d: ellipse(12, y - 2.4, 7.4, 2.4), fill: GOLD_400 });
  }

  return out;
};

/**
 * What an unrecognised icon key draws.
 *
 * A category's icon is chosen by whoever edits it, so a key can outlive the
 * drawing it named. A generic pair of coins is wrong but harmless; a missing
 * mark would collapse the tile and take the row's alignment with it.
 */
export const FALLBACK_MARK = coinStack(2);
