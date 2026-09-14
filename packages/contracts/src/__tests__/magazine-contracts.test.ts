import { describe, expect, it } from 'vitest';

import {
  DEFAULT_MAGAZINE_SORT,
  MAGAZINE_MAX_PAGE,
  parseMagazineArchiveQuery,
  parseMagazineSearch,
} from '../index.js';

describe('magazine archive query', () => {
  it('defaults to the newest first page', () => {
    expect(parseMagazineArchiveQuery({})).toEqual({ sort: DEFAULT_MAGAZINE_SORT, page: 1 });
  });

  it('keeps a known sort and a page in range', () => {
    expect(parseMagazineArchiveQuery({ sort: 'popular', page: '3' })).toEqual({
      sort: 'popular',
      page: 3,
    });
  });

  it('drops what does not parse instead of failing', () => {
    expect(
      parseMagazineArchiveQuery({ sort: 'price;DROP', page: String(MAGAZINE_MAX_PAGE + 1) }),
    ).toEqual({ sort: 'newest', page: 1 });
    expect(parseMagazineArchiveQuery({ sort: ['popular', 'newest'], page: '-2' })).toEqual({
      sort: 'popular',
      page: 1,
    });
  });
});

describe('magazine search term', () => {
  it('trims, and treats blank or oversized terms as no search', () => {
    expect(parseMagazineSearch({ q: '  حباب سکه ' })).toBe('حباب سکه');
    expect(parseMagazineSearch({ q: '   ' })).toBe('');
    expect(parseMagazineSearch({ q: 'x'.repeat(81) })).toBe('');
    expect(parseMagazineSearch({})).toBe('');
  });
});
