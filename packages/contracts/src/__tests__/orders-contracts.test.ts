import { describe, expect, it } from 'vitest';

import {
  cancelOrderSchema,
  orderMessageInputSchema,
  parseOrderListQuery,
  returnOrderSchema,
  reviewOrderSchema,
} from '../index.js';

describe('order list query', () => {
  it('defaults to the whole list with no search', () => {
    expect(parseOrderListQuery({})).toEqual({ filter: 'all', q: undefined });
  });

  it('keeps a known group and a trimmed term', () => {
    expect(parseOrderListQuery({ filter: 'returns', q: '  انگشتر ' })).toEqual({
      filter: 'returns',
      q: 'انگشتر',
    });
  });

  it('falls back instead of failing on what does not parse', () => {
    expect(parseOrderListQuery({ filter: 'refunded', q: 'x'.repeat(200) })).toEqual({
      filter: 'all',
      q: undefined,
    });
    expect(parseOrderListQuery({ filter: ['shipped'], q: '   ' })).toEqual({
      filter: 'all',
      q: undefined,
    });
  });
});

describe('order requests', () => {
  it('turns a blank cancellation note into no note', () => {
    const parsed = cancelOrderSchema.parse({ code: 'ZN-88412', reason: 'not-needed', note: '  ' });
    expect(parsed.note).toBeNull();
    expect(
      cancelOrderSchema.safeParse({ code: 'ZN-88412', reason: 'because', note: '' }).success,
    ).toBe(false);
  });

  it('refuses a return with no pieces, a repeated piece or a typed account number', () => {
    const base = { code: 'ZN-87204', reason: 'size', refundTo: 'wallet', note: '' };
    expect(returnOrderSchema.safeParse({ ...base, lines: [] }).success).toBe(false);
    expect(returnOrderSchema.safeParse({ ...base, lines: ['0', '0'] }).success).toBe(false);
    expect(
      returnOrderSchema.safeParse({ ...base, lines: ['0'], refundTo: 'IR062960000000100324200001' })
        .success,
    ).toBe(false);
    expect(returnOrderSchema.parse({ ...base, lines: ['1', '0'] }).lines).toEqual([1, 0]);
  });

  it('accepts ratings of one to five only', () => {
    const base = { code: 'ZN-87204', body: '', tags: [], anonymous: false };
    expect(reviewOrderSchema.safeParse({ ...base, ratings: ['5'] }).success).toBe(true);
    expect(reviewOrderSchema.safeParse({ ...base, ratings: ['0'] }).success).toBe(false);
    expect(reviewOrderSchema.safeParse({ ...base, ratings: ['4.5'] }).success).toBe(false);
    expect(
      reviewOrderSchema.safeParse({ ...base, ratings: ['5'], tags: ['packaging', 'packaging'] })
        .success,
    ).toBe(false);
  });

  it('refuses an empty message and a malformed order code', () => {
    expect(orderMessageInputSchema.safeParse({ code: 'ZN-88412', body: ' ' }).success).toBe(false);
    expect(orderMessageInputSchema.safeParse({ code: '../ZN-1', body: 'سلام' }).success).toBe(
      false,
    );
  });
});
