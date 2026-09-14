import type { Topic } from './types';

/** The magazine's sections, in the order the chips draw them. */
export const TOPICS: readonly Topic[] = [
  {
    id: 'market',
    slug: 'market',
    label: 'تحلیل بازار',
    description: 'وضعیت قیمت طلا، سکه و ارز؛ حباب، روند و آنچه بر خرید امروز شما اثر می‌گذارد.',
  },
  {
    id: 'guide',
    slug: 'buying-guide',
    label: 'راهنمای خرید',
    description:
      'سکه، آب‌شده یا شمش؟ راهنمای انتخاب بر اساس بودجه، افق زمانی و هدف خرید، با محاسبه اجرت و مالیات.',
  },
  {
    id: 'installment',
    slug: 'installment',
    label: 'خرید اقساطی',
    description:
      'شرایط، مدارک و محاسبه اقساط خرید طلا؛ توضیح شفاف پیش‌پرداخت و کارمزد بدون اصطلاحات پیچیده.',
  },
  {
    id: 'authenticity',
    slug: 'authenticity',
    label: 'تشخیص اصالت',
    description:
      'چطور طلای اصل را از تقلبی تشخیص دهیم؟ آزمون‌های عملی، خواندن شناسنامه شمش و بررسی نشان عیار.',
  },
  {
    id: 'care',
    slug: 'care-and-trends',
    label: 'نگهداری و ترند',
    description:
      'مراقبت از طلا و جواهر، تمیزکاری خانگی بی‌خطر و طرح‌هایی که امسال بیشتر خریده می‌شوند.',
  },
  {
    id: 'news',
    slug: 'news',
    label: 'اخبار زرنما',
    description: 'اطلاعیه‌ها، خدمات تازه و رویدادهای فروشگاه.',
  },
];

/** The archive of every topic at once. Not a topic, so not in `TOPICS`. */
export const ALL_TOPICS = {
  label: 'همه مقاله‌ها',
  chip: 'همه',
  description:
    'همه مقاله‌های کارشناسی زرنما درباره خرید، نگهداری و تحلیل بازار طلا — از راهنمای مبتدی تا تحلیل قیمت.',
} as const;
