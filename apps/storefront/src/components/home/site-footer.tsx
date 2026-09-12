import Link from 'next/link';

import {
  ClockIcon,
  InstagramIcon,
  PhoneIcon,
  PinIcon,
  TelegramIcon,
  WhatsappIcon,
} from '@/components/icons';
import { BRAND, SITE, SUPPORT } from '@/config/brand';
import { routes } from '@/lib/routes';

interface FooterGroup {
  readonly title: string;
  readonly items: readonly { readonly label: string; readonly href: string }[];
}

const GROUPS: readonly FooterGroup[] = [
  {
    title: 'راهنمای خرید',
    items: [
      { label: 'نحوه ثبت سفارش', href: routes.help('ordering') },
      { label: 'شیوه‌های پرداخت', href: routes.help('payment') },
      { label: 'ارسال و تحویل', href: routes.help('delivery') },
      { label: 'بازگشت کالا', href: routes.help('returns') },
      { label: 'سؤالات متداول', href: routes.help('faq') },
    ],
  },
  {
    title: 'خدمات مشتریان',
    items: [
      { label: 'پیگیری سفارش', href: routes.accountOrders() },
      { label: 'خرید اقساطی', href: routes.installment() },
      { label: 'قیمت لحظه‌ای طلا', href: routes.goldPrice() },
      { label: 'تماس با ما', href: routes.contact() },
    ],
  },
  {
    title: `درباره ${BRAND.name}`,
    items: [
      { label: 'معرفی مجموعه', href: routes.about() },
      { label: 'گواهی اصالت و مجوزها', href: routes.about('certificates') },
      { label: 'فرصت‌های شغلی', href: routes.about('careers') },
      { label: `مجله ${BRAND.name}`, href: routes.blog() },
      { label: 'حریم خصوصی', href: routes.privacy() },
      { label: 'شرایط فروش', href: routes.terms() },
    ],
  },
];

const SOCIAL = [
  { label: 'اینستاگرام', href: '#', icon: <InstagramIcon size={18} /> },
  { label: 'تلگرام', href: '#', icon: <TelegramIcon size={18} /> },
  { label: 'واتساپ', href: '#', icon: <WhatsappIcon size={18} /> },
] as const;

/**
 * The footer.
 *
 * The collapsible link groups are `<details>`/`<summary>` rather than the
 * design's buttons wired to component state. They open and close with no
 * JavaScript at all, come with the right roles and keyboard behaviour for
 * free, and — the part that matters commercially — the links inside a closed
 * group are still in the HTML, so a crawler follows them.
 *
 * The trust seals are marked as placeholders rather than drawn. A نماد اعتماد
 * الکترونیکی badge is a specific issued mark tied to a registration; drawing a
 * lookalike would be a claim the shop has not yet earned.
 */
export function SiteFooter() {
  return (
    <footer className="zn-foot">
      <div className="zn-foot__brand">
        <span className="zn-foot__wordmark">{BRAND.name}</span>
        <p className="zn-foot__blurb">{SITE.description}</p>
      </div>

      <div className="zn-foot__groups">
        {GROUPS.map((group, position) => (
          // The canvas has the first group open on load, so the footer is not a
          // wall of three closed bars. `open` only sets the initial state.
          <details className="zn-foot__group" key={group.title} open={position === 0}>
            <summary className="zn-foot__summary">
              <span>{group.title}</span>
              <span className="zn-foot__marker" aria-hidden="true" />
            </summary>
            <ul className="zn-foot__links">
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link className="zn-foot__link" href={item.href}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>

      <address className="zn-foot__contact">
        <span className="zn-foot__contact-row">
          <PhoneIcon size={16} />
          {/* A phone number is an LTR sequence even inside Persian text. */}
          <a className="zn-foot__tel" href={`tel:${SUPPORT.telephone}`} dir="ltr">
            {SUPPORT.telephoneLabel}
          </a>
        </span>
        <span className="zn-foot__contact-row zn-foot__contact-row--block">
          <PinIcon size={16} />
          <span>تهران، بازار بزرگ، سرای طلا، پلاک ۱۴</span>
        </span>
        <span className="zn-foot__contact-row">
          <ClockIcon size={16} />
          <span>شنبه تا پنج‌شنبه، ۱۰ تا ۱۹</span>
        </span>
      </address>

      <div className="zn-foot__seals">
        <span className="zn-foot__seal">نماد اعتماد الکترونیکی</span>
        <span className="zn-foot__seal">اتحادیه طلا و جواهر</span>
        <ul className="zn-foot__social">
          {SOCIAL.map((channel) => (
            <li key={channel.label}>
              <a className="zn-foot__social-link" href={channel.href} aria-label={channel.label}>
                {channel.icon}
              </a>
            </li>
          ))}
        </ul>
      </div>

      <p className="zn-foot__legal">© ۱۴۰۵ {BRAND.legalName} — تمامی حقوق محفوظ است.</p>
    </footer>
  );
}
