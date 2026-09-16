import { describe, expect, it } from 'vitest';

import { newTraceId } from '../trace-id.js';

describe('newTraceId', () => {
  it('stays inside what a double holds exactly', () => {
    // The id is handed over inside a JSON body and parsed by the panel, so the
    // 2^53 ceiling binds rather than the vendor's documented 2^63.
    for (let attempt = 0; attempt < 500; attempt += 1) {
      expect(Number.isSafeInteger(Number(newTraceId()))).toBe(true);
    }
  });

  it('is digits, and fits the contract for our own reference', () => {
    expect(newTraceId()).toMatch(/^\d{1,19}$/u);
  });

  it('sorts by time, so a log reads in order', () => {
    const earlier = newTraceId(new Date('2026-01-01T00:00:00Z'));
    const later = newTraceId(new Date('2026-01-01T00:00:01Z'));

    expect(Number(later)).toBeGreaterThan(Number(earlier));
  });

  it('separates two messages sent in the same millisecond', () => {
    const instant = new Date('2026-01-01T00:00:00Z');
    const ids = new Set(Array.from({ length: 200 }, () => newTraceId(instant)));

    // Ten thousand values per millisecond: collisions are possible and rare,
    // which is the right trade against an id that outgrows a double by 2048.
    expect(ids.size).toBeGreaterThan(150);
  });

  it('does not go negative for a clock set before the epoch it counts from', () => {
    expect(Number(newTraceId(new Date('1999-01-01T00:00:00Z')))).toBeGreaterThanOrEqual(0);
  });
});
