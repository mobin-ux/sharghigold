/**
 * The provinces and cities a delivery address may name.
 *
 * A closed list, and the reason is not tidiness. Province and city are free
 * text on the form, they are printed on the courier's manifest and used to
 * price shipping, and text that reaches those places from a request body is
 * text somebody chose. Checking the pair against this table on the server is
 * what turns two open fields into two selects that cannot be lied to.
 *
 * It is data rather than a database table for now, because the shipping zones
 * that will eventually own it do not exist. When they do, this file becomes a
 * query and `isKnownRegion` keeps its signature.
 *
 * Not the full 31 provinces: these are the ones the shop delivers to today.
 */

export const PROVINCES: Readonly<Record<string, readonly string[]>> = {
  تهران: ['تهران', 'شهریار', 'اسلامشهر', 'ورامین', 'پاکدشت'],
  البرز: ['کرج', 'فردیس', 'نظرآباد', 'هشتگرد'],
  اصفهان: ['اصفهان', 'کاشان', 'خمینی‌شهر', 'نجف‌آباد'],
  فارس: ['شیراز', 'مرودشت', 'کازرون', 'لار'],
  'خراسان رضوی': ['مشهد', 'نیشابور', 'سبزوار', 'تربت حیدریه'],
  'آذربایجان شرقی': ['تبریز', 'مراغه', 'مرند', 'اهر'],
  مازندران: ['ساری', 'بابل', 'آمل', 'قائم‌شهر'],
  گیلان: ['رشت', 'بندر انزلی', 'لاهیجان', 'تالش'],
  خوزستان: ['اهواز', 'آبادان', 'دزفول', 'خرمشهر'],
  قم: ['قم'],
};

export const PROVINCE_NAMES: readonly string[] = Object.keys(PROVINCES);

export const DEFAULT_PROVINCE = 'تهران';

/** The cities of a province, or an empty list if the province is unknown. */
export function citiesOf(province: string): readonly string[] {
  return PROVINCES[province] ?? [];
}

/** True when this city really is in this province. */
export function isKnownRegion(province: string, city: string): boolean {
  return citiesOf(province).includes(city);
}
