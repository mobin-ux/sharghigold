/**
 * PLACEHOLDER CONTENT — the magazine.
 *
 * Editorial, not catalogue: these are articles a marketing team writes, and
 * when the admin panel exists they are rows it owns. They live under `server/`
 * because nothing above this file may hold a copy of them — a component that
 * embedded an article would make publishing one a deploy.
 *
 * The body is an array of paragraphs rather than a blob of HTML. A CMS that
 * returns markup is a CMS that can put a `<script>` on every reader's page;
 * paragraphs are text, and the storefront decides what element they go in.
 */

export interface Article {
  readonly slug: string;
  readonly category: string;
  readonly title: string;
  /** Already a Persian-calendar date string; no conversion happens here. */
  readonly published: string;
  /** The same instant as `published`, for ordering. */
  readonly publishedAt: string;
  readonly readingMinutes: number;
  /** One sentence, used as the meta description and the article's own lede. */
  readonly lede: string;
  readonly body: readonly string[];
}

export const ARTICLES: readonly Article[] = [
  {
    slug: 'gold-price-outlook',
    category: 'تحلیل بازار',
    title: 'قیمت طلا در نیمه دوم ۱۴۰۵ به کدام سمت می‌رود؟',
    published: '۱۲ مرداد ۱۴۰۵',
    publishedAt: '2026-08-03',
    readingMinutes: 9,
    lede: 'سه عاملی که بیشترین اثر را بر قیمت طلای داخلی دارند، و آنچه از روند شش ماه گذشته می‌شود خواند.',
    body: [
      'قیمت طلا در ایران از دو مسیر تعیین می‌شود: قیمت جهانی اونس، و نرخ برابری ارز. هر تحلیلی که تنها یکی از این دو را ببیند، نیمی از تصویر را از دست داده است.',
      'در شش ماه گذشته، نوسان نرخ ارز سهم بزرگ‌تری در تغییرات قیمت داخلی داشته است. این یعنی روزهایی که اونس جهانی ثابت مانده، قیمت گرم ۱۸ عیار در بازار داخلی همچنان جابه‌جا شده است.',
      'برای خریدار خرده‌فروشی، نتیجه عملی ساده است: قیمت لحظه‌ای را مبنا بگیرید و به نرخ چند روز پیش استناد نکنید. به همین دلیل است که قیمت هر سفارش در زرنما فقط پنج دقیقه قفل می‌شود.',
      'این مطلب تحلیل بازار است و توصیه سرمایه‌گذاری نیست. تصمیم خرید یا فروش با خود شماست.',
    ],
  },
  {
    slug: 'coin-bullion-or-melt',
    category: 'راهنمای خرید',
    title: 'سکه، آب‌شده یا شمش؟ راهنمای انتخاب بر اساس بودجه',
    published: '۸ مرداد ۱۴۰۵',
    publishedAt: '2026-07-30',
    readingMinutes: 7,
    lede: 'تفاوت این سه در حباب، نقدشوندگی و هزینه نگهداری است — نه در خود طلا.',
    body: [
      'هر سه شکل، طلا هستند؛ تفاوت در چیزی است که همراه طلا می‌خرید. سکه حباب دارد، یعنی قیمتی بالاتر از ارزش طلای درونش. شمش حباب کمتری دارد ولی خریدار کمتری هم دارد.',
      'آب‌شده نزدیک‌ترین قیمت به ارزش ذاتی طلاست، اما تشخیص عیار آن بدون آزمایشگاه ممکن نیست و خرید آن از فروشنده ناشناس ریسک دارد.',
      'قاعده سرانگشتی: بودجه کوچک و افق کوتاه، سکه؛ بودجه بزرگ و افق بلند، شمش با گواهی؛ خرید از منبع مطمئن در هر دو حالت شرط اول است.',
      'در همه موارد، فاکتور رسمی بگیرید. بدون فاکتور، هنگام فروش مجدد چیزی برای استناد ندارید.',
    ],
  },
  {
    slug: 'spotting-fake-gold',
    category: 'تشخیص اصالت',
    title: 'پنج آزمون خانگی برای تشخیص طلای تقلبی',
    published: '۳ مرداد ۱۴۰۵',
    publishedAt: '2026-07-25',
    readingMinutes: 6,
    lede: 'هیچ‌کدام جای آزمایشگاه را نمی‌گیرند، اما هر پنج‌تا با هم اغلب کافی‌اند.',
    body: [
      'آزمون آهن‌ربا: طلا مغناطیسی نیست. اگر قطعه به آهن‌ربا چسبید، طلا نیست — هرچند نچسبیدن به تنهایی اثبات اصالت نیست.',
      'آزمون وزن مخصوص: طلای ۱۸ عیار چگالی مشخصی دارد. قطعه‌ای که برای اندازه‌اش سبک است، جای پرسش دارد.',
      'آزمون نشان: هر قطعه معتبر عیار خود را روی خود دارد. نبودِ نشان، یا نشان ناخوانا، علامت هشدار است.',
      'آزمون تغییر رنگ: طلا اکسید نمی‌شود. لکه سبز یا سیاه روی سطح، یعنی فلز پایه از زیر آبکاری بیرون زده است.',
      'آزمون فاکتور: مطمئن‌ترین آزمون، فروشنده است. فاکتور رسمی با وزن، عیار و اجرت، و پروانه کسب اتحادیه، بیش از هر آزمون خانگی ارزش دارد.',
    ],
  },
  {
    slug: 'how-installments-work',
    category: 'خرید اقساطی',
    title: 'خرید اقساطی طلا چطور کار می‌کند؟ از درخواست تا تحویل',
    published: '۲۸ تیر ۱۴۰۵',
    publishedAt: '2026-07-19',
    readingMinutes: 8,
    lede: 'پیش‌پرداخت، کارمزد و زمان تحویل — سه چیزی که پیش از ثبت سفارش اقساطی باید بدانید.',
    body: [
      'خرید اقساطی طلا در ایران «فروش اقساطی» است: بخشی از مبلغ را امروز می‌پردازید و باقی را طی چند ماه. قیمت طلا در لحظه ثبت سفارش قفل می‌شود.',
      'کارمزد اقساط روی مانده بدهی حساب می‌شود، نه روی کل مبلغ. هرچه مدت بازپرداخت بلندتر باشد، مبلغ نهایی بیشتر از خرید نقدی خواهد بود.',
      'کالا پس از پرداخت پیش‌پرداخت و تأیید احراز هویت ارسال می‌شود؛ منتظر ماندن تا پایان اقساط لازم نیست.',
      'شرایط دقیق و مبلغ هر قسط در صفحه «خرید اقساطی» و پیش از تأیید نهایی سفارش به شما نشان داده می‌شود.',
    ],
  },
];

/** Newest first. */
export function listArticles(): readonly Article[] {
  return ARTICLES.toSorted((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

/**
 * One article, or undefined.
 *
 * `slug` comes from the URL, so it is arbitrary text. It is only ever compared
 * against slugs this module already holds — never used to build a path or read
 * a file — so an unknown or hostile value can do nothing but miss.
 */
export function findArticle(slug: string): Article | undefined {
  return ARTICLES.find((article) => article.slug === slug);
}
