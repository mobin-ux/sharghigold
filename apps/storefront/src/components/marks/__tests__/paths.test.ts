import { describe, expect, it } from 'vitest';

import { MARKS } from '@/components/marks/registry';
import {
  balance,
  circle,
  coin,
  coinStack,
  dotGrid,
  ellipse,
  ingot,
  pointAt,
  ring,
} from '@/components/marks/paths';

/**
 * These generators are a port of the arithmetic in the design canvas, and the
 * whole reason for porting the arithmetic rather than its output is that the
 * arithmetic can be checked. The rendered result is verified separately
 * against the canvas itself; what is pinned here is the geometry, so a
 * refactor cannot quietly move a shape.
 */
describe('path generators', () => {
  it('draws a circle as two half arcs closing on themselves', () => {
    // Starts at the top, sweeps down 2r, sweeps back up 2r.
    expect(circle(12, 12, 5)).toBe('M12 7a5 5 0 1 0 0 10a5 5 0 1 0 0 -10Z');
  });

  it('draws a ring as an outer circle followed by an inner one', () => {
    // Two subpaths in one `d`, filled even-odd — that is what makes the hole.
    expect(ring(12, 12, 9, 6)).toBe(circle(12, 12, 9) + circle(12, 12, 6));
  });

  it('draws an ellipse with independent radii', () => {
    expect(ellipse(12, 10, 7.4, 2.4)).toBe('M4.6 10a7.4 2.4 0 1 0 14.8 0a7.4 2.4 0 1 0 -14.8 0Z');
  });

  it('layers a coin as rim, face and centre', () => {
    const paths = coin(12, 12, 10);

    expect(paths).toHaveLength(3);
    // The face and centre are fixed fractions of the rim, so a coin at any
    // radius keeps its proportions.
    expect(paths[0]?.d).toBe(circle(12, 12, 10));
    expect(paths[1]?.d).toBe(circle(12, 12, 7.4));
    expect(paths[2]?.d).toBe(circle(12, 12, 3.8));
  });

  it('draws an ingot narrower at the base than the top', () => {
    const [body] = ingot(12, 10, 8, 6);

    // A trapezoid: the bottom edge is 0.8 of the top, which is what reads as
    // perspective.
    expect(body?.d).toBe('M4 10 20 10 18.4 16 5.6 16Z');
  });

  it('stacks one path pair per coin in a budget band', () => {
    expect(coinStack(1)).toHaveLength(2);
    expect(coinStack(3)).toHaveLength(6);
  });

  it('puts one stone per weight band on the balance', () => {
    const base = 5;

    expect(balance(1)).toHaveLength(base + 1);
    expect(balance(2)).toHaveLength(base + 2);
    expect(balance(3)).toHaveLength(base + 3);
  });

  it('fills the instalment grid with one dot per cell', () => {
    expect(dotGrid(4, 3, 'x')).toHaveLength(12);
    expect(dotGrid(6, 6, 'x')).toHaveLength(36);
  });

  it('places points on the circle around the mark centre', () => {
    const [x, y] = pointAt(0, 7.7);

    expect(x).toBeCloseTo(19.7, 10);
    expect(y).toBeCloseTo(12, 10);

    const [x90, y90] = pointAt(90, 7.7);
    expect(x90).toBeCloseTo(12, 10);
    expect(y90).toBeCloseTo(19.7, 10);
  });
});

describe('mark registry', () => {
  it('gives every mark at least one path', () => {
    const empty = Object.entries(MARKS)
      .filter(([, paths]) => paths.length === 0)
      .map(([key]) => key);

    expect(empty).toEqual([]);
  });

  it('colours every path from a token, never a literal', () => {
    // The whole set has to re-tint with the palette. A stray hex would survive
    // a theme change and quietly stop matching everything around it.
    const literals: string[] = [];

    for (const [key, paths] of Object.entries(MARKS)) {
      for (const path of paths) {
        if (!path.fill.startsWith('var(--')) literals.push(`${key}: ${path.fill}`);
      }
    }

    expect(literals).toEqual([]);
  });

  it('names the eight top-level marks the rail needs', () => {
    for (const family of [
      'ring',
      'earring',
      'necklace',
      'bangle',
      'bracelet',
      'set',
      'coin',
      'gift',
    ]) {
      expect(MARKS[family], family).toBeDefined();
    }
  });
});
