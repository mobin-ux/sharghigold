/**
 * The words a category listing puts around its grid.
 *
 * Editorial content, not taxonomy: what a category is called in a heading, the
 * noun the instalment banner uses, and the short buying guide under the grid.
 * Kept apart from `server/catalogue/taxonomy.ts` because the two will have
 * different owners — merchandising decides which sub-types exist, content
 * writes about them — and so different tables when the admin panel exists.
 *
 * Every guide describes how *this* shop prices, and nothing it does not do.
 * The formula sentence matches `@sharghigold/money`'s `quoteGoldPrice`: VAT
 * falls on the making fee and the profit, never on the metal.
 */

export interface CategoryCopy {
  /** The page heading: «گوشواره طلا». */
  readonly heading: string;
  /** The bare noun, for «همین گوشواره را قسطی بخرید». */
  readonly noun: string;
  /**
   * Whether a sub-type heading reads as noun + label («گوشواره آویز»). Off
   * where the labels are already whole names («ست هدیه», «ربع‌سکه»).
   */
  readonly prefixSubTypes: boolean;
  readonly guide: { readonly title: string; readonly body: string };
}

const PRICE_SENTENCE =
  'وزن ضرب‌در نرخ روز طلا، به‌اضافه اجرت ساخت و سود فروشنده، و مالیات بر ارزش افزوده که فقط روی اجرت و سود محاسبه می‌شود';

const CLOSING = 'همه کالاها با فاکتور رسمی و ضمانت اصالت ارسال می‌شوند.';

const COPY: Readonly<Record<string, CategoryCopy>> = {
  earrings: {
    heading: 'گوشواره طلا',
    noun: 'گوشواره',
    prefixSubTypes: true,
    guide: {
      title: 'راهنمای خرید گوشواره طلا',
      body: `قیمت گوشواره طلا از این بخش‌ها تشکیل می‌شود: ${PRICE_SENTENCE}. مدل‌های میخی و حلقه‌ای معمولاً وزن کمتری دارند و برای استفاده روزمره مناسب‌ترند؛ مدل‌های آویز و مجلسی وزن بیشتری دارند. ${CLOSING}`,
    },
  },
  necklaces: {
    heading: 'گردنبند طلا',
    noun: 'گردنبند',
    prefixSubTypes: true,
    guide: {
      title: 'راهنمای خرید گردنبند طلا',
      body: `قیمت گردنبند طلا از این بخش‌ها تشکیل می‌شود: ${PRICE_SENTENCE}. در گردنبندهای زنجیری، طول و ضخامت زنجیر بیشترین اثر را روی وزن دارد؛ پلاک‌ها و مدل‌های ظریف سبک‌ترند. ${CLOSING}`,
    },
  },
  rings: {
    heading: 'انگشتر طلا',
    noun: 'انگشتر',
    prefixSubTypes: true,
    guide: {
      title: 'راهنمای خرید انگشتر طلا',
      body: `قیمت انگشتر طلا از این بخش‌ها تشکیل می‌شود: ${PRICE_SENTENCE}. پیش از خرید، سایز انگشت را با راهنمای سایز صفحه هر محصول بسنجید؛ رینگ‌های ظریف سبک‌ترند و مدل‌های نگین‌دار اجرت بیشتری دارند. ${CLOSING}`,
    },
  },
  bangles: {
    heading: 'النگو طلا',
    noun: 'النگو',
    prefixSubTypes: true,
    guide: {
      title: 'راهنمای خرید النگو طلا',
      body: `قیمت النگو طلا از این بخش‌ها تشکیل می‌شود: ${PRICE_SENTENCE}. النگوها از سنگین‌ترین قطعه‌های زیورآلات‌اند، پس وزن بیش از اجرت روی قیمت اثر دارد؛ اندازه دور مچ را پیش از انتخاب بسنجید. ${CLOSING}`,
    },
  },
  bracelets: {
    heading: 'دستبند طلا',
    noun: 'دستبند',
    prefixSubTypes: true,
    guide: {
      title: 'راهنمای خرید دستبند طلا',
      body: `قیمت دستبند طلا از این بخش‌ها تشکیل می‌شود: ${PRICE_SENTENCE}. دستبندهای زنجیری و بافت در وزن‌های متنوعی ساخته می‌شوند؛ طول دستبند را متناسب با دور مچ انتخاب کنید. ${CLOSING}`,
    },
  },
  sets: {
    heading: 'سرویس و نیم‌ست طلا',
    noun: 'سرویس',
    prefixSubTypes: false,
    guide: {
      title: 'راهنمای خرید سرویس طلا',
      body: `قیمت سرویس و نیم‌ست طلا از این بخش‌ها تشکیل می‌شود: ${PRICE_SENTENCE}. قیمت یک سرویس جمع قیمت قطعه‌های آن است و وزن هر قطعه در صفحه محصول آمده است. ${CLOSING}`,
    },
  },
  coins: {
    heading: 'سکه و شمش طلا',
    noun: 'سکه',
    prefixSubTypes: false,
    guide: {
      title: 'راهنمای خرید سکه و شمش',
      body: `قیمت سکه و شمش بیش از هر کالای دیگری به نرخ روز طلا وابسته است. پیش از خرید، وزن و عیار درج‌شده در صفحه محصول را با نرخ لحظه‌ای مقایسه کنید. ${CLOSING}`,
    },
  },
  gifts: {
    heading: 'هدیه طلا',
    noun: 'هدیه',
    prefixSubTypes: false,
    guide: {
      title: 'راهنمای خرید هدیه طلا',
      body: `قیمت هر هدیه طلا از این بخش‌ها تشکیل می‌شود: ${PRICE_SENTENCE}. برای هدیه‌های با بودجه مشخص، از فیلتر حداکثر قیمت استفاده کنید. ${CLOSING}`,
    },
  },
};

/**
 * The copy for a category, or a plain fallback built from its title.
 *
 * A category added to the taxonomy before anyone has written about it still
 * gets a correct heading; it just has no guide until one is written.
 */
export function categoryCopy(
  slug: string,
  title: string,
): CategoryCopy & { readonly hasGuide: boolean } {
  const copy = COPY[slug];
  if (copy !== undefined) return { ...copy, hasGuide: true };

  return {
    heading: title,
    noun: title,
    prefixSubTypes: false,
    guide: { title: '', body: '' },
    hasGuide: false,
  };
}

/** A sub-type's heading: «گوشواره آویز», or the label where it is a whole name. */
export function subTypeHeading(copy: CategoryCopy, label: string): string {
  return copy.prefixSubTypes && !label.includes(copy.noun) ? `${copy.noun} ${label}` : label;
}
