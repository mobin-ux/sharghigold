import { describe, expect, it } from 'vitest';

import { requestOtpSchema, verifyOtpSchema } from '../auth.js';
import { API_ERROR_STATUS, apiErrorCodeSchema, API_ERROR_CODES } from '../api.js';
import { facetQuerySchema, facetTileSchema, iconKeySchema } from '../catalogue.js';
import { buildPageMeta, cursorQuerySchema, MAX_PAGE_SIZE, pageQuerySchema } from '../pagination.js';
import {
  iranianMobileSchema,
  iranianNationalIdSchema,
  isValidIranianNationalId,
  milligramsStringSchema,
  rialsStringSchema,
  slugSchema,
  stripControlCharacters,
  userTextSchema,
} from '../primitives.js';

describe('iranianMobileSchema', () => {
  it('normalises every shape a user might type to 09XXXXXXXXX', () => {
    for (const input of [
      '09123456789',
      '+989123456789',
      '00989123456789',
      '989123456789',
      '9123456789',
      '0912 345 6789',
      '0912-345-6789',
      '  09123456789  ',
    ]) {
      expect(iranianMobileSchema.parse(input)).toBe('09123456789');
    }
  });

  it('rejects numbers that are not Iranian mobiles', () => {
    for (const input of ['02112345678', '0912345678', '091234567890', 'abc', '']) {
      expect(iranianMobileSchema.safeParse(input).success).toBe(false);
    }
  });
});

describe('isValidIranianNationalId', () => {
  it('accepts identifiers with a correct check digit', () => {
    expect(isValidIranianNationalId('1234567891')).toBe(true);
    expect(isValidIranianNationalId('0012345679')).toBe(true);
  });

  it('rejects a wrong check digit', () => {
    expect(isValidIranianNationalId('1234567890')).toBe(false);
  });

  it('rejects repeated digits, which pass the arithmetic but are never issued', () => {
    // 1111111111 satisfies the checksum, so the explicit guard is what stops it.
    expect(isValidIranianNationalId('1111111111')).toBe(false);
    expect(isValidIranianNationalId('0000000000')).toBe(false);
  });

  it('rejects wrong lengths and non-digits', () => {
    expect(isValidIranianNationalId('123456789')).toBe(false);
    expect(isValidIranianNationalId('12345678912')).toBe(false);
    expect(isValidIranianNationalId('123456789a')).toBe(false);
  });

  it('surfaces a Persian message through the schema', () => {
    const result = iranianNationalIdSchema.safeParse('1234567890');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('کد ملی معتبر نیست');
    }
  });
});

describe('money and weight on the wire', () => {
  it('accepts integer strings only, never JSON numbers', () => {
    expect(rialsStringSchema.parse('236469672')).toBe('236469672');
    expect(rialsStringSchema.parse('-500')).toBe('-500');
    expect(rialsStringSchema.safeParse('236469672.5').success).toBe(false);
    expect(rialsStringSchema.safeParse('1e6').success).toBe(false);
  });

  it('preserves precision a double would lose', () => {
    const huge = '9007199254740993'; // MAX_SAFE_INTEGER + 2
    expect(BigInt(rialsStringSchema.parse(huge))).toBe(9_007_199_254_740_993n);
  });

  it('requires weights to be non-negative whole milligrams', () => {
    expect(milligramsStringSchema.parse('1800')).toBe('1800');
    expect(milligramsStringSchema.safeParse('-1800').success).toBe(false);
    expect(milligramsStringSchema.safeParse('1.8').success).toBe(false);
  });
});

describe('slugSchema', () => {
  it('accepts kebab-case Latin slugs', () => {
    expect(slugSchema.parse('gold-necklace-18k')).toBe('gold-necklace-18k');
  });

  it('rejects spaces, capitals and trailing hyphens', () => {
    for (const input of ['Gold-Necklace', 'gold necklace', 'gold--necklace', 'gold-', '']) {
      expect(slugSchema.safeParse(input).success).toBe(false);
    }
  });
});

describe('user text', () => {
  // Control characters are written as escapes so this file stays plain text.
  const BELL = '\u0007';
  const SOH = '\u0001';
  const APC = '\u009F';

  it('strips control characters while keeping Persian text intact', () => {
    expect(stripControlCharacters(`سلام${BELL} دنیا`)).toBe('سلام دنیا');
    expect(stripControlCharacters(`گردنبند${APC}`)).toBe('گردنبند');
  });

  it('enforces the length bound', () => {
    const schema = userTextSchema(10);
    expect(schema.parse('کوتاه')).toBe('کوتاه');
    expect(schema.safeParse('x'.repeat(11)).success).toBe(false);
    expect(schema.safeParse('   ').success).toBe(false);
  });

  it('rejects input that is empty once control characters are removed', () => {
    // Control characters are not whitespace, so trim() leaves them and a
    // min-length check placed before the transform sees a non-empty string.
    // The value then transforms to '' and would be stored as empty.
    const schema = userTextSchema(10);
    expect(schema.safeParse(BELL + SOH).success).toBe(false);
    expect(schema.safeParse(APC).success).toBe(false);
    // A control character mixed with real text still yields the real text.
    expect(schema.parse(`گردن${BELL}بند`)).toBe('گردنبند');
  });
});

describe('auth request schemas', () => {
  it('normalises the mobile number on the way in', () => {
    expect(requestOtpSchema.parse({ mobile: '+989123456789' })).toEqual({
      mobile: '09123456789',
    });
  });

  it('rejects unexpected fields rather than ignoring them', () => {
    // A client must not be able to smuggle privileged state into a request.
    const result = verifyOtpSchema.safeParse({
      mobile: '09123456789',
      code: '123456',
      role: 'admin',
      isKycComplete: true,
    });
    expect(result.success).toBe(false);
  });

  it('accepts a well-formed verification', () => {
    expect(verifyOtpSchema.parse({ mobile: '09123456789', code: '123456' })).toEqual({
      mobile: '09123456789',
      code: '123456',
    });
  });
});

describe('pagination', () => {
  it('applies defaults when the query is empty', () => {
    expect(pageQuerySchema.parse({})).toEqual({ page: 1, pageSize: 20 });
  });

  it('coerces query-string text to numbers', () => {
    expect(pageQuerySchema.parse({ page: '3', pageSize: '50' })).toEqual({
      page: 3,
      pageSize: 50,
    });
  });

  it('refuses an expensive page size at parse time', () => {
    expect(pageQuerySchema.safeParse({ pageSize: String(MAX_PAGE_SIZE + 1) }).success).toBe(false);
    expect(pageQuerySchema.safeParse({ page: '0' }).success).toBe(false);
    expect(cursorQuerySchema.safeParse({ limit: '1000' }).success).toBe(false);
  });

  it('computes page metadata', () => {
    expect(buildPageMeta(1, 20, 45)).toEqual({
      page: 1,
      pageSize: 20,
      totalItems: 45,
      totalPages: 3,
    });
    expect(buildPageMeta(1, 20, 0).totalPages).toBe(0);
  });
});

describe('api error vocabulary', () => {
  it('maps every declared code to an HTTP status', () => {
    for (const code of API_ERROR_CODES) {
      expect(API_ERROR_STATUS[code]).toBeGreaterThanOrEqual(400);
    }
    expect(Object.keys(API_ERROR_STATUS)).toHaveLength(API_ERROR_CODES.length);
  });

  it('rejects codes outside the vocabulary', () => {
    expect(apiErrorCodeSchema.safeParse('SOMETHING_ELSE').success).toBe(false);
  });
});

describe('catalogue icon keys', () => {
  it('accepts the dotted keys the storefront registry uses', () => {
    for (const key of ['earring', 'earring.hoop', 'weight.scale-1', 'installment.36']) {
      expect(iconKeySchema.safeParse(key).success, key).toBe(true);
    }
  });

  it('rejects anything that is not a key', () => {
    // This value is chosen by whoever edits a category and is used to look up
    // a component. Keeping it to lower-case dotted segments means a category
    // editor can pick the wrong drawing but cannot inject anything.
    for (const key of [
      '<svg onload=alert(1)>',
      'Earring',
      'earring..hoop',
      '.earring',
      'earring.',
      'earring hoop',
      '../secret',
      '',
    ]) {
      expect(iconKeySchema.safeParse(key).success, key).toBe(false);
    }
  });
});

describe('facet filters', () => {
  it('accepts camelCase parameter names with plain values', () => {
    expect(facetQuerySchema.safeParse({ maxPrice: '100000000' }).success).toBe(true);
    expect(facetQuerySchema.safeParse({ minWeightMg: '2000', maxWeightMg: '5000' }).success).toBe(
      true,
    );
  });

  it('rejects parameter names that are not identifiers', () => {
    for (const name of ['max-price', 'Max', '2max', 'max price', '']) {
      expect(facetQuerySchema.safeParse({ [name]: '1' }).success, name).toBe(false);
    }
  });

  it('requires a tile to name a real category slug', () => {
    const tile = { label: 'x', slug: 'earrings', query: {}, icon: null };

    expect(facetTileSchema.safeParse(tile).success).toBe(true);
    expect(facetTileSchema.safeParse({ ...tile, slug: '../admin' }).success).toBe(false);
    expect(facetTileSchema.safeParse({ ...tile, slug: 'Earrings' }).success).toBe(false);
  });

  it('strips control characters from a tile label', () => {
    const bell = String.fromCharCode(7);
    const parsed = facetTileSchema.parse({
      label: `طلا${bell}`,
      slug: 'earrings',
      query: {},
      icon: null,
    });

    expect(parsed.label).toBe('طلا');
  });
});
