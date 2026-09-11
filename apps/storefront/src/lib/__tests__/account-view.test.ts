import { describe, expect, it } from 'vitest';

import {
  addressLine,
  codeLabel,
  deviceMeta,
  flashMessage,
  initialOf,
  jalaliDate,
  mobileLabel,
  nameOrDefault,
  orderActionLabel,
  postalLabel,
  relativeMinutes,
} from '@/lib/account-view';

/**
 * These turn records into the strings on the page. They are pinned because the
 * failures are quiet ones: a leading zero dropped from a code, a name rendered
 * as half a character, a date a day out because the day was read in the wrong
 * time zone.
 */
const NOW = new Date('2026-09-11T09:00:00.000Z');

describe('the date', () => {
  it('is written in the Persian calendar, in Tehran', () => {
    // 2026-09-11T09:00Z is 11 Sep in Tehran: 20 Shahrivar 1405.
    expect(jalaliDate('2026-09-11T09:00:00.000Z')).toContain('۱۴۰۵');
    expect(jalaliDate('2026-09-11T09:00:00.000Z')).toContain('۲۰');
  });

  it('reads the day in Tehran rather than in UTC', () => {
    // Half past eight in the evening UTC is past midnight in Tehran, so this
    // is the following day there.
    const evening = jalaliDate('2026-09-11T20:30:00.000Z');
    const morning = jalaliDate('2026-09-11T09:00:00.000Z');
    expect(evening).not.toBe(morning);
  });

  it('says nothing rather than «Invalid Date» for a value it cannot read', () => {
    expect(jalaliDate('not a date')).toBe('');
  });
});

describe('identity', () => {
  it('writes a mobile number in Persian digits', () => {
    expect(mobileLabel('09120001234')).toBe('۰۹۱۲۰۰۰۱۲۳۴');
  });

  it('keeps the leading zero of a code, which a number would lose', () => {
    expect(codeLabel('04829')).toBe('۰۴۸۲۹');
  });

  it('takes a whole first character for the avatar', () => {
    expect(initialOf('مهدی رضایی')).toBe('م');
    expect(Array.from(initialOf('مهدی رضایی'))).toHaveLength(1);
  });

  it('falls back to the brand letter when there is no name', () => {
    expect(initialOf(null)).toBe('ز');
    expect(initialOf('   ')).toBe('ز');
  });

  it('names an unnamed customer rather than showing an empty line', () => {
    expect(nameOrDefault(null)).toBe('کاربر زرنما');
    expect(nameOrDefault('مهدی')).toBe('مهدی');
  });
});

describe('an address', () => {
  const base = {
    province: 'تهران',
    city: 'تهران',
    line: 'سعادت‌آباد، خیابان علامه شمالی',
    plate: '۷',
    unit: '۴',
  };

  it('does not say the same place twice', () => {
    expect(addressLine(base).startsWith('تهران، سعادت‌آباد')).toBe(true);
  });

  it('names the province when it differs from the city', () => {
    expect(addressLine({ ...base, province: 'البرز', city: 'کرج' })).toContain('البرز، کرج');
  });

  it('leaves out a unit there is none of', () => {
    const withUnit = addressLine(base);
    const without = addressLine({ ...base, unit: null });
    expect(withUnit.length).toBeGreaterThan(without.length);
  });

  it('labels a postal code as one', () => {
    expect(postalLabel('1194733109')).toBe('کد پستی ۱۱۹۴۷۳۳۱۰۹');
  });
});

describe('a device', () => {
  it('calls the last few minutes «active now»', () => {
    expect(relativeMinutes('2026-09-11T08:58:00.000Z', NOW)).toBe('هم‌اکنون فعال');
  });

  it('counts minutes, then hours', () => {
    expect(relativeMinutes('2026-09-11T08:30:00.000Z', NOW)).toBe('۳۰ دقیقه پیش');
    expect(relativeMinutes('2026-09-11T06:00:00.000Z', NOW)).toBe('۳ ساعت پیش');
  });

  it('says nothing for a timestamp it cannot read', () => {
    expect(relativeMinutes('nonsense', NOW)).toBe('');
  });

  it('joins the place to the time, and omits the place when there is none', () => {
    expect(deviceMeta('تهران', '2026-09-11T08:58:00.000Z', NOW)).toBe('تهران · هم‌اکنون فعال');
    expect(deviceMeta(null, '2026-09-11T08:58:00.000Z', NOW)).toBe('هم‌اکنون فعال');
  });
});

describe('an order', () => {
  it('offers the action that state allows', () => {
    expect(orderActionLabel('processing')).toBe('پیگیری مرسوله');
    expect(orderActionLabel('delivered')).toBe('ثبت دیدگاه');
    expect(orderActionLabel('cancelled')).toBe('خرید دوباره');
  });
});

describe('the flash message', () => {
  it('resolves a known key to its own sentence', () => {
    expect(flashMessage('welcome')).toBeTypeOf('string');
  });

  it('ignores anything that is not a key', () => {
    // The key travels in the query string, so this is the guard that stops a
    // link putting a sentence of somebody else's choosing on the page.
    expect(flashMessage('<script>alert(1)</script>')).toBeUndefined();
    expect(flashMessage('حساب شما حذف شد')).toBeUndefined();
    expect(flashMessage(undefined)).toBeUndefined();
  });
});
