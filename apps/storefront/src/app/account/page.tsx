import { OrderStepper } from '@sharghigold/ui';
import type { Metadata } from 'next';
import Link from 'next/link';

import { AccountHero } from '@/components/account/account-hero';
import { Flash } from '@/components/account/flash';
import { KycBanner } from '@/components/account/kyc-banner';
import { MenuList, type MenuEntry } from '@/components/account/menu-list';
import { QuickTiles } from '@/components/account/quick-tiles';
import { WalletCard } from '@/components/account/wallet-card';
import { BottomNav } from '@/components/bottom-nav';
import {
  ClockIcon,
  GoldBarIcon,
  HeartIcon,
  HelpIcon,
  InvoiceIcon,
  LockIcon,
  MessageIcon,
  PhoneIcon,
  PinIcon,
  ShieldPlainIcon,
  UserIcon,
  WalletIcon,
} from '@/components/icons';
import { SUPPORT } from '@/config/brand';
import { ORDER_STEPS, persianCount, weightLabel } from '@/lib/account-view';
import { getOverview } from '@/server/account/account';
import { requireViewer } from '@/server/account/session';

import { SignOutButton } from './sign-out-button';

import './account.css';

/**
 * Rendered per request, and never stored anywhere.
 *
 * Everything on this page belongs to one person: a balance, an address count,
 * an order in flight. A cached copy is somebody else's account waiting to be
 * served, so the route is dynamic and the response is marked private.
 */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'حساب من',
  // The rest of the shop wants to be found. This does not: an indexed account
  // page is a signed-out snapshot of somebody's data in a search engine.
  robots: { index: false, follow: false },
};

export default async function AccountPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await requireViewer();
  const overview = getOverview(viewer);
  const done = (await searchParams)['done'];

  const shopping: readonly MenuEntry[] = [
    {
      href: '/account/orders',
      label: 'سفارش‌های من',
      icon: <InvoiceIcon size={19} />,
      meta: persianCount(overview.orderCount),
    },
    { href: '/wallet', label: 'کیف پول و تراکنش‌ها', icon: <WalletIcon size={19} /> },
    {
      href: '/account/gold',
      label: 'طلای من (گرمی)',
      icon: <GoldBarIcon size={19} />,
      meta: weightLabel(overview.goldMilligrams),
    },
  ];

  const account: readonly MenuEntry[] = [
    { href: '/account/profile', label: 'اطلاعات حساب', icon: <UserIcon size={19} /> },
    { href: '/account/identity', label: 'احراز هویت', icon: <ShieldPlainIcon size={19} /> },
    { href: '/account/security', label: 'امنیت و ورود', icon: <LockIcon size={19} /> },
    {
      href: '/account/addresses',
      label: 'آدرس‌های من',
      icon: <PinIcon size={19} />,
      meta: persianCount(overview.addressCount),
    },
    {
      href: '/account/favourites',
      label: 'علاقه‌مندی‌ها',
      icon: <HeartIcon size={19} />,
      // Spread rather than `meta: undefined`: a count of zero has no figure to
      // show, and an absent property is not the same as a present empty one.
      ...(overview.favouriteCount === 0 ? {} : { meta: persianCount(overview.favouriteCount) }),
    },
    { href: '/account/recently-viewed', label: 'بازدیدهای اخیر', icon: <ClockIcon size={19} /> },
  ];

  const support: readonly MenuEntry[] = [
    {
      href: '/account/messages',
      label: 'پیام‌ها و اعلان‌ها',
      icon: <MessageIcon size={19} />,
      ...(overview.unreadMessageCount === 0
        ? {}
        : { meta: persianCount(overview.unreadMessageCount) }),
    },
    { href: '/help', label: 'پرسش‌های متداول', icon: <HelpIcon size={19} /> },
    { href: '/contact', label: 'تماس با پشتیبانی', icon: <PhoneIcon size={19} /> },
  ];

  return (
    <>
      <a className="skip-link" href="#account">
        رفتن به محتوای حساب
      </a>

      <div className="zn-shell">
        <AccountHero displayName={overview.profile.displayName} mobile={overview.profile.mobile} />

        <main id="account">
          <Flash code={typeof done === 'string' ? done : undefined} />

          <WalletCard balanceRials={overview.wallet.balanceRials} />
          <KycBanner status={overview.profile.kyc.status} />

          <QuickTiles
            orderCount={overview.orderCount}
            addressCount={overview.addressCount}
            favouriteCount={overview.favouriteCount}
            installmentCount={0}
          />

          {overview.activeOrder === null ? null : (
            <section className="zn-track" aria-labelledby="zn-track-h">
              <div className="zn-track__head">
                <h2 className="zn-track__title" id="zn-track-h">
                  سفارش در جریان
                </h2>
                <span className="zn-track__code">{overview.activeOrder.code}</span>
                <Link
                  className="zn-track__more"
                  href={`/account/orders/${overview.activeOrder.code}`}
                >
                  جزئیات ‹
                </Link>
              </div>
              <OrderStepper steps={ORDER_STEPS} current={overview.activeOrder.step} />
            </section>
          )}

          <MenuList id="zn-menu-shopping" title="خرید و پرداخت" items={shopping} />
          <MenuList id="zn-menu-account" title="حساب کاربری" items={account} />
          <MenuList id="zn-menu-support" title="پشتیبانی" items={support} />

          <div className="zn-signout">
            <SignOutButton />
            <p className="zn-signout__note">
              پشتیبانی{' '}
              <a className="zn-signout__tel" href={`tel:${SUPPORT.telephone}`} dir="ltr">
                {SUPPORT.telephoneLabel}
              </a>
            </p>
          </div>

          <div className="zn-account__tail zn-account__tail--short" />
        </main>
      </div>

      <BottomNav />
    </>
  );
}
