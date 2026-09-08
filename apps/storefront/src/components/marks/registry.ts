/**
 * Every named mark in the catalogue, keyed by the `icon` value a category or
 * facet tile carries.
 *
 * The keys are the contract between merchandising data and artwork: a category
 * says `icon: "earring.hoop"` and this decides what that looks like. Keys are
 * dotted — `<family>` for the eight top-level marks, `<family>.<variant>` for
 * the rest — but nothing depends on that shape; it is a naming habit, not a
 * lookup rule.
 *
 * Paths are ported from the `Zarnama Categories` canvas.
 */
import {
  balance,
  calendar,
  circle,
  coin,
  coinStack,
  COLLAR,
  diamond,
  dotGrid,
  giftBox,
  GOLD_200,
  GOLD_300,
  GOLD_400,
  GOLD_50,
  GOLD_500,
  GOLD_600,
  heart,
  ingot,
  pointAt,
  ring,
  teardrop,
  TEAL_500,
  TEAL_700,
  type MarkPath,
} from './paths';

/* -------------------------------------------------------------------------- */
/* The eight family marks                                                     */
/* -------------------------------------------------------------------------- */

const FAMILY: Record<string, readonly MarkPath[]> = {
  ring: [
    {
      d: 'M12 22.4a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Zm0-2.9a4.3 4.3 0 1 0 0-8.6 4.3 4.3 0 0 0 0 8.6Z',
      fill: GOLD_600,
      evenOdd: true,
    },
    { d: 'M9.5 8.7 12 7.1l2.5 1.6-.7 1.5h-3.6Z', fill: GOLD_500 },
    { d: 'M12 1.4 15.2 5 12 8.6 8.8 5Z', fill: TEAL_700 },
    { d: 'M12 1.4 15.2 5H8.8Z', fill: TEAL_500 },
  ],
  earring: [
    {
      d: 'M12 1.8a4.4 4.4 0 0 0-4.4 4.4v1.4h2.5V6.2a1.9 1.9 0 0 1 3.8 0v2.1h2.5V6.2A4.4 4.4 0 0 0 12 1.8Z',
      fill: GOLD_600,
    },
    { d: 'M12 9.2c-2.7 3.7-4 6-4 7.6a4 4 0 0 0 8 0c0-1.6-1.3-3.9-4-7.6Z', fill: GOLD_600 },
    {
      d: 'M12 11.4c-1.4 2-2.1 3.2-2.1 4.1a2.1 2.1 0 0 0 1.1 1.9c-1.2-1.9-.6-3.8 1-6Z',
      fill: GOLD_400,
    },
  ],
  necklace: [
    { d: COLLAR, fill: GOLD_600 },
    {
      d: 'M12 12.8c-2.1 2.8-3.2 4.5-3.2 5.7a3.2 3.2 0 0 0 6.4 0c0-1.2-1.1-2.9-3.2-5.7Z',
      fill: GOLD_500,
    },
    {
      d: 'M12 15.4c-1.1 1.6-1.6 2.5-1.6 3.1a1.6 1.6 0 0 0 .8 1.5c-.9-1.5-.4-3 .8-4.6Z',
      fill: GOLD_300,
    },
  ],
  bangle: [
    {
      d: 'M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20Zm0-3.6a6.4 6.4 0 1 0 0-12.8 6.4 6.4 0 0 0 0 12.8Z',
      fill: GOLD_600,
      evenOdd: true,
    },
    { d: 'M4.6 6.6A8.2 8.2 0 0 1 12 2.6v3.4a4.9 4.9 0 0 0-4.4 2.4Z', fill: GOLD_400 },
    { d: 'M12 1.2 14.3 4 12 6.8 9.7 4Z', fill: TEAL_700 },
  ],
  bracelet: [
    {
      d: 'M20 9.8a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4Zm-2.3 5.7a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4Zm-5.7 2.3a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4Zm-5.7-2.3a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4ZM4 9.8a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4Zm2.3-5.7a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4Zm11.4 0a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4Z',
      fill: GOLD_600,
    },
    { d: 'M12 1.4 15 5l-3 3.6L9 5Z', fill: TEAL_700 },
  ],
  set: [
    {
      d: 'M6.2 2.4h2.4c0 2.9 1.5 5 3.4 5s3.4-2.1 3.4-5h2.4c0 4.3-2.6 7.4-5.8 7.4S6.2 6.7 6.2 2.4Z',
      fill: GOLD_600,
    },
    {
      d: 'M12 9.6c-1.7 2.3-2.6 3.7-2.6 4.6a2.6 2.6 0 0 0 5.2 0c0-.9-.9-2.3-2.6-4.6Z',
      fill: GOLD_500,
    },
    {
      d: 'M3.5 11.2a2.2 2.2 0 0 0-2.2 2.2v.9h1.3v-.9a.9.9 0 0 1 1.8 0v1.1h1.3v-1.1a2.2 2.2 0 0 0-2.2-2.2Z',
      fill: GOLD_600,
    },
    {
      d: 'M3.5 15c-1.4 1.9-2.1 3-2.1 3.8a2.1 2.1 0 0 0 4.2 0c0-.8-.7-1.9-2.1-3.8Z',
      fill: GOLD_500,
    },
    {
      d: 'M20.5 11.2a2.2 2.2 0 0 0-2.2 2.2v.9h1.3v-.9a.9.9 0 0 1 1.8 0v1.1h1.3v-1.1a2.2 2.2 0 0 0-2.2-2.2Z',
      fill: GOLD_600,
    },
    {
      d: 'M20.5 15c-1.4 1.9-2.1 3-2.1 3.8a2.1 2.1 0 0 0 4.2 0c0-.8-.7-1.9-2.1-3.8Z',
      fill: GOLD_500,
    },
  ],
  coin: [
    {
      d: 'M12 3.2c4.6 0 8.2 1.7 8.2 3.9v10c0 2.2-3.6 3.9-8.2 3.9S3.8 19.3 3.8 17.1v-10c0-2.2 3.6-3.9 8.2-3.9Z',
      fill: GOLD_600,
    },
    {
      d: 'M12 11c4.6 0 8.2-1.7 8.2-3.9v3.5c0 2.2-3.6 3.9-8.2 3.9s-8.2-1.7-8.2-3.9V7.1c0 2.2 3.6 3.9 8.2 3.9Z',
      fill: GOLD_400,
    },
    {
      d: 'M12 4.9c3.2 0 5.8 1 5.8 2.2S15.2 9.3 12 9.3 6.2 8.3 6.2 7.1 8.8 4.9 12 4.9Z',
      fill: GOLD_200,
    },
  ],
  gift: [
    { d: 'M3.4 10.6h17.2v10.2a1.6 1.6 0 0 1-1.6 1.6H5a1.6 1.6 0 0 1-1.6-1.6Z', fill: GOLD_600 },
    { d: 'M2.2 6.4h19.6v4.2H2.2Z', fill: GOLD_500 },
    { d: 'M10.6 6.4h2.8v16h-2.8Z', fill: GOLD_200 },
    {
      d: 'M12 6.4C9.6 6.4 6.8 5.6 6.8 3.8S9 1.2 12 5.2c3-4 5.2-3.2 5.2-1.4S14.4 6.4 12 6.4Z',
      fill: TEAL_700,
    },
  ],
};

/* -------------------------------------------------------------------------- */
/* Model marks                                                                */
/* -------------------------------------------------------------------------- */

const EARRINGS: Record<string, readonly MarkPath[]> = {
  'earring.drop': [
    { d: 'M9.2 5.2a2.8 2.8 0 0 1 5.6 0v2.4h-2.3V5.2a.5.5 0 0 0-1 0Z', fill: GOLD_600 },
    teardrop(12, 7.6, 1.15, GOLD_500),
    {
      d: 'M12 10.6c-1.5 2.1-2.1 3.3-2.1 4.2a2.1 2.1 0 0 0 1.1 1.9c-1.3-1.9-.7-3.8 1-6.1Z',
      fill: GOLD_300,
    },
  ],
  'earring.hoop': [
    { d: ring(12, 13.8, 7.8, 4.6), fill: GOLD_600, evenOdd: true },
    { d: 'M10.4 3h3.2v3.6h-3.2Z', fill: GOLD_400 },
    { d: circle(12, 3.2, 1.8), fill: TEAL_700 },
  ],
  'earring.stud': [
    { d: 'M11.2 13.4h1.6v7.4h-1.6Z', fill: GOLD_400 },
    { d: 'M9.2 19.4h5.6v1.8H9.2Z', fill: GOLD_600 },
    { d: circle(12, 6.4, 2.9), fill: GOLD_500 },
    { d: circle(15.9, 10.3, 2.9), fill: GOLD_500 },
    { d: circle(8.1, 10.3, 2.9), fill: GOLD_500 },
    { d: circle(12, 14.2, 2.9), fill: GOLD_500 },
    { d: circle(12, 10.3, 3), fill: TEAL_700 },
  ],
  'earring.climber': [
    { d: circle(15.6, 4.4, 1.7), fill: TEAL_700 },
    { d: circle(14.4, 8.2, 2.4), fill: GOLD_600 },
    { d: circle(12.5, 11.9, 2.2), fill: GOLD_600 },
    { d: circle(10.7, 15.3, 2), fill: GOLD_500 },
    { d: circle(9.2, 18.5, 1.7), fill: GOLD_400 },
  ],
  'earring.occasion': [
    { d: circle(12, 3.4, 1.9), fill: TEAL_700 },
    { d: 'M5.4 6.4h13.2a1.3 1.3 0 0 1 0 2.6H5.4a1.3 1.3 0 0 1 0-2.6Z', fill: GOLD_600 },
    teardrop(7.2, 9, 0.6, GOLD_500),
    teardrop(12, 9, 0.95, GOLD_500),
    teardrop(16.8, 9, 0.6, GOLD_500),
  ],
};

const NECKLACES: Record<string, readonly MarkPath[]> = {
  'necklace.name-plate': [
    { d: COLLAR, fill: GOLD_600 },
    {
      d: 'M6.4 13.4h11.2a1.7 1.7 0 0 1 1.7 1.7v3.8a1.7 1.7 0 0 1-1.7 1.7H6.4a1.7 1.7 0 0 1-1.7-1.7v-3.8a1.7 1.7 0 0 1 1.7-1.7Z',
      fill: GOLD_500,
    },
    { d: 'M7.6 15.6h8.8v1.2H7.6ZM7.6 17.8h5.6v1.2H7.6Z', fill: TEAL_700 },
  ],
  'necklace.venetian': [
    diamond(3.2, 4.8, 1.9, GOLD_600),
    diamond(5.8, 8.6, 1.9, GOLD_600),
    diamond(8.6, 11.6, 1.9, GOLD_600),
    diamond(12, 13.4, 2.1, TEAL_700),
    diamond(15.4, 11.6, 1.9, GOLD_600),
    diamond(18.2, 8.6, 1.9, GOLD_600),
    diamond(20.8, 4.8, 1.9, GOLD_600),
  ],
  'necklace.heart-butterfly': [
    { d: COLLAR, fill: GOLD_600 },
    heart(12, 14.4, 0.68, GOLD_500),
    { d: 'M12 17.4c-2.2-1.8-3-2.8-3-3.8a1.5 1.5 0 0 1 3-.7Z', fill: GOLD_300 },
  ],
  'necklace.choker': [
    {
      d: 'M12 4.6c-5.1 0-9.2 3.3-9.2 7.4s4.1 7.4 9.2 7.4 9.2-3.3 9.2-7.4-4.1-7.4-9.2-7.4Zm0 3.4c3.4 0 6.2 1.8 6.2 4s-2.8 4-6.2 4-6.2-1.8-6.2-4 2.8-4 6.2-4Z',
      fill: GOLD_600,
      evenOdd: true,
    },
    { d: circle(12, 19.6, 2.2), fill: TEAL_700 },
  ],
  'necklace.occasion': [
    { d: COLLAR, fill: GOLD_600 },
    teardrop(7.6, 12.6, 0.55, GOLD_500),
    teardrop(12, 13.4, 0.88, GOLD_500),
    teardrop(16.4, 12.6, 0.55, GOLD_500),
  ],
};

const RINGS: Record<string, readonly MarkPath[]> = {
  'ring.solitaire': [
    { d: ring(12, 15.4, 6.4, 4), fill: GOLD_600, evenOdd: true },
    { d: 'M9.8 9.2h4.4l-.7 2.2h-3Z', fill: GOLD_500 },
    { d: 'M12 2.2 16.2 6.4 12 11.2 7.8 6.4Z', fill: TEAL_700 },
    { d: 'M12 2.2 16.2 6.4H7.8Z', fill: TEAL_500 },
  ],
  'ring.wedding': [
    { d: ring(8.8, 13.8, 6.2, 3.9), fill: GOLD_600, evenOdd: true },
    { d: ring(15.2, 13.8, 6.2, 3.9), fill: GOLD_400, evenOdd: true },
  ],
  'ring.slim': [
    { d: ring(12, 13.6, 7.4, 6.1), fill: GOLD_600, evenOdd: true },
    { d: circle(12, 4.4, 1.9), fill: TEAL_700 },
  ],
  'ring.mens': [
    { d: ring(12, 15.6, 6.4, 3.4), fill: GOLD_600, evenOdd: true },
    {
      d: 'M6.6 5.2h10.8a1.5 1.5 0 0 1 1.5 1.5v3.8a1.5 1.5 0 0 1-1.5 1.5H6.6a1.5 1.5 0 0 1-1.5-1.5V6.7a1.5 1.5 0 0 1 1.5-1.5Z',
      fill: GOLD_500,
    },
    { d: 'M8.2 7h7.6v2.8H8.2Z', fill: TEAL_700 },
  ],
  'ring.gemstone': [
    { d: ring(12, 15.4, 6.4, 4), fill: GOLD_600, evenOdd: true },
    { d: circle(7.2, 9.2, 1.7), fill: GOLD_500 },
    { d: circle(16.8, 9.2, 1.7), fill: GOLD_500 },
    { d: circle(12, 7.2, 3.6), fill: TEAL_700 },
    { d: circle(10.8, 6.2, 1), fill: TEAL_500 },
  ],
};

const BANGLES: Record<string, readonly MarkPath[]> = {
  'bangle.single': [
    { d: ring(12, 12, 9.4, 6), fill: GOLD_600, evenOdd: true },
    { d: 'M4.2 6.2A9.4 9.4 0 0 1 12 2.6V6a6 6 0 0 0-5.2 3Z', fill: GOLD_400 },
  ],
  'bangle.stacked': [
    { d: ring(6.4, 12, 5.6, 3.9), fill: GOLD_600, evenOdd: true },
    { d: ring(12, 12, 5.6, 3.9), fill: GOLD_400, evenOdd: true },
    { d: ring(17.6, 12, 5.6, 3.9), fill: GOLD_600, evenOdd: true },
  ],
  'bangle.woven': [
    { d: ring(12, 12, 9.4, 6), fill: GOLD_600, evenOdd: true },
    ...[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
      const [x, y] = pointAt(angle, 7.7);
      return diamond(x, y, 1.5, GOLD_300);
    }),
  ],
  'bangle.cartier': [
    { d: ring(12, 12, 9.4, 6), fill: GOLD_600, evenOdd: true },
    { d: circle(4.4, 12, 1.8), fill: TEAL_700 },
    { d: circle(19.6, 12, 1.8), fill: TEAL_700 },
  ],
  'bangle.occasion': [
    { d: ring(12, 12, 9.4, 6), fill: GOLD_600, evenOdd: true },
    ...[270, 330, 30, 90, 150, 210].map((angle) => {
      const [x, y] = pointAt(angle, 7.7);
      return { d: circle(x, y, 1.5), fill: TEAL_700 };
    }),
  ],
};

const BRACELETS: Record<string, readonly MarkPath[]> = {
  'bracelet.chain': (
    [
      [3.6, 14.4],
      [7.8, 11.8],
      [12, 10.8],
      [16.2, 11.8],
      [20.4, 14.4],
    ] as const
  ).map(([x, y], index) => ({
    d: ring(x, y, 2.9, 1.6),
    fill: index % 2 === 1 ? GOLD_400 : GOLD_600,
    evenOdd: true,
  })),
  'bracelet.braided': [
    {
      d: 'M1.6 8.6c3.5 0 3.5 6.4 7 6.4s3.5-6.4 7-6.4 3.5 6.4 7 6.4v3c-3.5 0-3.5-6.4-7-6.4s-3.5 6.4-7 6.4-3.5-6.4-7-6.4Z',
      fill: GOLD_600,
    },
    {
      d: 'M1.6 5.2c3.5 0 3.5 6.4 7 6.4s3.5-6.4 7-6.4 3.5 6.4 7 6.4v3c-3.5 0-3.5-6.4-7-6.4s-3.5 6.4-7 6.4-3.5-6.4-7-6.4Z',
      fill: GOLD_400,
    },
  ],
  'bracelet.leather': [
    { d: 'M1.6 9.4h7.6v5.2H1.6ZM14.8 9.4h7.6v5.2h-7.6Z', fill: TEAL_700 },
    {
      d: 'M8.4 7.6h7.2a1.4 1.4 0 0 1 1.4 1.4v6a1.4 1.4 0 0 1-1.4 1.4H8.4A1.4 1.4 0 0 1 7 15V9a1.4 1.4 0 0 1 1.4-1.4Z',
      fill: GOLD_600,
    },
    { d: 'M10.2 10.4h3.6v3.2h-3.6Z', fill: GOLD_300 },
  ],
  'bracelet.sport': [
    {
      d: 'M2.4 8.6h19.2a1.6 1.6 0 0 1 1.6 1.6v3.6a1.6 1.6 0 0 1-1.6 1.6H2.4A1.6 1.6 0 0 1 .8 13.8v-3.6A1.6 1.6 0 0 1 2.4 8.6Z',
      fill: GOLD_600,
    },
    {
      d: 'M9.4 6.8h5.2a1.4 1.4 0 0 1 1.4 1.4v7.6a1.4 1.4 0 0 1-1.4 1.4H9.4A1.4 1.4 0 0 1 8 15.8V8.2a1.4 1.4 0 0 1 1.4-1.4Z',
      fill: TEAL_700,
    },
    { d: 'M10.4 10.4h3.2v3.2h-3.2Z', fill: GOLD_400 },
  ],
  'bracelet.plate': [
    ...(
      [
        [2.6, 12],
        [5.6, 12],
        [18.4, 12],
        [21.4, 12],
      ] as const
    ).map(([x, y]) => ({ d: ring(x, y, 2.2, 1.2), fill: GOLD_600, evenOdd: true })),
    {
      d: 'M8.4 8.6h7.2a1.6 1.6 0 0 1 1.6 1.6v3.6a1.6 1.6 0 0 1-1.6 1.6H8.4a1.6 1.6 0 0 1-1.6-1.6v-3.6a1.6 1.6 0 0 1 1.6-1.6Z',
      fill: GOLD_500,
    },
    { d: 'M9.4 10.8h5.2v1.1H9.4ZM9.4 12.8h3.4v1.1H9.4Z', fill: TEAL_700 },
  ],
};

const SETS: Record<string, readonly MarkPath[]> = {
  'set.half': [
    {
      d: 'M3.4 2.6h2.2c0 3.4 2.5 6 5.6 6s5.6-2.6 5.6-6h2.2c0 4.6-3.5 8.2-7.8 8.2S3.4 7.2 3.4 2.6Z',
      fill: GOLD_600,
    },
    teardrop(11.2, 10.6, 0.82, GOLD_500),
    { d: 'M18.8 12.4a1.8 1.8 0 0 1 3.6 0v1.4h-1.5v-1.4a.3.3 0 0 0-.6 0Z', fill: GOLD_600 },
    teardrop(20.6, 13.8, 0.58, GOLD_500),
  ],
  'set.full': [
    {
      d: 'M4.6 2.4h2.2c0 3 2.3 5.4 5.2 5.4s5.2-2.4 5.2-5.4h2.2c0 4.2-3.3 7.6-7.4 7.6S4.6 6.6 4.6 2.4Z',
      fill: GOLD_600,
    },
    teardrop(12, 9.6, 0.74, GOLD_500),
    { d: circle(3.2, 12.2, 1.5), fill: GOLD_600 },
    teardrop(3.2, 13.2, 0.44, GOLD_500),
    { d: circle(20.8, 12.2, 1.5), fill: GOLD_600 },
    teardrop(20.8, 13.2, 0.44, GOLD_500),
    { d: ring(12, 19.6, 3.6, 2.3), fill: GOLD_400, evenOdd: true },
  ],
  'set.bridal': [
    { d: 'M4.4 8.2 7.6 3.4 12 6.6l4.4-3.2 3.2 4.8Z', fill: GOLD_500 },
    { d: circle(12, 6.4, 1.5), fill: TEAL_700 },
    {
      d: 'M4.6 10.6h2.2c0 3 2.3 5.4 5.2 5.4s5.2-2.4 5.2-5.4h2.2c0 4.2-3.3 7.6-7.4 7.6s-7.4-3.4-7.4-7.6Z',
      fill: GOLD_600,
    },
    teardrop(12, 17.6, 0.52, GOLD_500),
  ],
  'set.gift': [
    ...giftBox(),
    {
      d: 'M12 7.8C9.8 7.8 7.4 7 7.4 5.4S9.4 3 12 6.4c2.6-3.4 4.6-2.6 4.6-1s-2.4 2.4-4.6 2.4Z',
      fill: TEAL_700,
    },
  ],
  'set.mother-daughter': [
    {
      d: 'M1.6 3.2h2c0 2.9 2.1 5.2 4.8 5.2s4.8-2.3 4.8-5.2h2c0 4-3 7.2-6.8 7.2S1.6 7.2 1.6 3.2Z',
      fill: GOLD_600,
    },
    teardrop(8.4, 10, 0.7, GOLD_500),
    {
      d: 'M14.6 9.2h1.4c0 1.9 1.4 3.4 3.2 3.4s3.2-1.5 3.2-3.4h1.4c0 2.7-2.1 4.8-4.6 4.8s-4.6-2.1-4.6-4.8Z',
      fill: GOLD_400,
    },
    teardrop(19.2, 13.8, 0.46, GOLD_500),
  ],
};

const COINS: Record<string, readonly MarkPath[]> = {
  'coin.emami': coin(12, 12, 9.2),
  'coin.half': coin(12, 12, 7.2),
  'coin.quarter': coin(12, 12, 5.4),
  'coin.gram': coin(12, 12, 3.8),
  'coin.bullion': ingot(12, 10.6, 8.4, 7.6),
  'coin.ingot-1g': ingot(12, 12.6, 4.6, 4.4),
  'coin.ingot-5g': ingot(12, 11.4, 6.8, 6.2),
  'coin.melted': [
    { d: 'M9.4 3.2h5.2l-1 5.6H10.4Z', fill: GOLD_500 },
    {
      d: 'M3.2 15.8c0-4.2 3.6-6.8 8.8-6.8s8.8 2.6 8.8 6.8-3.9 5.2-8.8 5.2-8.8-1-8.8-5.2Z',
      fill: GOLD_600,
    },
    {
      d: 'M6.4 13.4c1.4-1.2 3.3-1.8 5.6-1.8s4.2.6 5.6 1.8c-1.4 1-3.3 1.6-5.6 1.6s-4.2-.6-5.6-1.6Z',
      fill: GOLD_300,
    },
  ],
};

const GIFTS: Record<string, readonly MarkPath[]> = {
  'gift.birthday': [
    ...giftBox(),
    { d: 'M11.2 2.8h1.6v5h-1.6Z', fill: GOLD_400 },
    { d: 'M12 .8c1.4 1.3 1.9 2.1 1.9 2.7a1.9 1.9 0 0 1-3.8 0c0-.6.5-1.4 1.9-2.7Z', fill: TEAL_700 },
  ],
  'gift.anniversary': [
    { d: ring(8.6, 14.6, 6, 3.8), fill: GOLD_600, evenOdd: true },
    { d: ring(15.4, 14.6, 6, 3.8), fill: GOLD_400, evenOdd: true },
    heart(12, 4.4, 0.52, TEAL_700),
  ],
  'gift.baby': [
    { d: ring(12, 14.2, 6.8, 4.8), fill: GOLD_600, evenOdd: true },
    { d: circle(12, 4.8, 2.8), fill: GOLD_500 },
    { d: circle(12, 4.8, 1.2), fill: TEAL_700 },
    { d: circle(5.4, 7, 1.4), fill: GOLD_400 },
    { d: circle(18.6, 7, 1.4), fill: GOLD_400 },
  ],
  'gift.mother': [heart(12, 8.4, 1.08, GOLD_600), heart(12, 9.6, 0.52, TEAL_700)],
  'gift.budget': [
    ...giftBox(),
    { d: circle(18.8, 17.6, 3.8), fill: TEAL_700 },
    { d: circle(18.8, 17.6, 1.9), fill: GOLD_300 },
  ],
};

/* -------------------------------------------------------------------------- */
/* Filter marks                                                               */
/* -------------------------------------------------------------------------- */

const FILTERS: Record<string, readonly MarkPath[]> = {
  'budget.1': coinStack(1),
  'budget.2': coinStack(2),
  'budget.3': coinStack(3),

  'weight.scale-1': balance(1),
  'weight.scale-2': balance(2),
  'weight.scale-3': balance(3),
  'weight.coin-quarter': coin(12, 12, 5),
  'weight.coin-half': coin(12, 12, 6.8),
  'weight.coin-full': coin(12, 12, 8.8),
  'weight.ingot-small': ingot(12, 12.4, 5.2, 4.8),
  'weight.ingot-large': ingot(12, 10.8, 7.6, 7),

  'offers.making-fee': [
    {
      d: 'M20.8 12.8 13 20.6a1.7 1.7 0 0 1-2.4 0l-7.2-7.2a1.7 1.7 0 0 1-.5-1.2V4.6A1.7 1.7 0 0 1 4.6 3h7.6a1.7 1.7 0 0 1 1.2.5l7.4 7.4a1.7 1.7 0 0 1 0 2.4Z',
      fill: GOLD_600,
    },
    { d: circle(7.4, 7.4, 1.9), fill: GOLD_50 },
    { d: 'M9.6 16 15.2 10.4l1.5 1.5L11.1 17.5Z', fill: GOLD_300 },
    { d: circle(10.6, 12.6, 1.3), fill: TEAL_700 },
    { d: circle(15.6, 15.4, 1.3), fill: TEAL_700 },
  ],
  'offers.weekly': [
    ...calendar(),
    { d: 'M6.4 13.2h11.2v2.4H6.4ZM6.4 16.8h6.6v2.4H6.4Z', fill: GOLD_300 },
  ],
  'offers.new': [
    {
      d: 'M12 1.8 14.3 9.2 21.7 11.5 14.3 13.8 12 21.2 9.7 13.8 2.3 11.5 9.7 9.2Z',
      fill: GOLD_600,
    },
    { d: 'M19.6 2.4 20.5 5.1 23.2 6 20.5 6.9 19.6 9.6 18.7 6.9 16 6 18.7 5.1Z', fill: TEAL_700 },
  ],

  'installment.no-deposit': [
    {
      d: 'M2.4 5.6h19.2a1.7 1.7 0 0 1 1.7 1.7v9.4a1.7 1.7 0 0 1-1.7 1.7H2.4A1.7 1.7 0 0 1 .7 16.7V7.3a1.7 1.7 0 0 1 1.7-1.7Z',
      fill: GOLD_600,
    },
    { d: 'M.7 9.2h22.6v3H.7Z', fill: TEAL_700 },
    { d: circle(17.8, 15, 2.8), fill: GOLD_400 },
    { d: circle(17.8, 15, 1.4), fill: GOLD_600 },
    { d: 'M4.2 14h5.6v1.9H4.2Z', fill: GOLD_300 },
  ],
  'installment.12': [...calendar(), ...dotGrid(4, 3, GOLD_300)],
  'installment.36': [...calendar(), ...dotGrid(6, 6, GOLD_300)],
};

/* -------------------------------------------------------------------------- */
/* The registry                                                               */
/* -------------------------------------------------------------------------- */

export const MARKS: Readonly<Record<string, readonly MarkPath[]>> = {
  ...FAMILY,
  ...EARRINGS,
  ...NECKLACES,
  ...RINGS,
  ...BANGLES,
  ...BRACELETS,
  ...SETS,
  ...COINS,
  ...GIFTS,
  ...FILTERS,

  // The canvas reuses two set drawings for the bridal collection rather than
  // giving them their own, so these are aliases and not near-duplicates.
  'set.engagement-half': SETS['set.half'] ?? [],
  'set.bridesmaid': SETS['set.gift'] ?? [],
};
