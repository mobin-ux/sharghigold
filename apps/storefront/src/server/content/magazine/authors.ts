/**
 * PLACEHOLDER CONTENT — the magazine's writers.
 *
 * Invented, as the articles are: the design needs bylines to lay out. Before
 * launch these rows are replaced by the people who actually write, with the
 * credentials they actually hold; a byline claiming a qualification is a
 * statement the shop is making to its customers.
 */
import type { Author } from './types';

export const AUTHORS: readonly Author[] = [
  {
    slug: 'reza-mahdavi',
    name: 'رضا مهدوی',
    initials: 'ر.م',
    role: 'کارشناس ارشد بازار طلا',
    credential: 'عضو اتحادیه طلا و جواهر تهران · ۱۸ سال معامله در بازار',
    yearsInMarket: 18,
    bio: 'رضا مهدوی از سال ۱۳۸۶ در بازار آب‌شده و سکه فعال است و ستون تحلیل زرنما را می‌نویسد. تمرکز او بر رابطه نرخ ارز، اونس جهانی و حباب سکه است.',
    specialties: ['تحلیل قیمت', 'حباب سکه', 'بازار آب‌شده'],
  },
  {
    slug: 'sara-kazemi',
    name: 'سارا کاظمی',
    initials: 'س.ک',
    role: 'کارشناس ارزیابی و اصالت',
    credential: 'ارزیاب فلزات گران‌بها · ۱۱ سال',
    yearsInMarket: 11,
    bio: 'سارا کاظمی مسئول کنترل اصالت و عیارسنجی در زرنما است و راهنماهای عملی تشخیص طلای تقلبی و نگهداری جواهر را می‌نویسد.',
    specialties: ['عیارسنجی', 'تشخیص تقلبی', 'نگهداری جواهر'],
  },
  {
    slug: 'amir-rastegar',
    name: 'امیر رستگار',
    initials: 'ا.ر',
    role: 'مدیر خدمات مشتریان',
    credential: '۹ سال تجربه فروش و خدمات خرده‌فروشی طلا',
    yearsInMarket: 9,
    bio: 'امیر رستگار مسئول خدمات مشتریان زرنما است و درباره خرید اقساطی، فاکتور و خدمات پس از فروش می‌نویسد.',
    specialties: ['خرید اقساطی', 'فاکتور رسمی', 'خدمات پس از فروش'],
  },
];
