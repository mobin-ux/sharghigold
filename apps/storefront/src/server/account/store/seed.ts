import { getGoldRate } from '@/lib/gold-price';

import { accountsAvailable } from './availability';
import type { AddressRecord, CustomerRecord, SessionRecord, Tables } from './records';

/** The number the design is drawn around, and the only account with history. */
export const DEMO_MOBILE = '09120001234';

/**
 * Populate one account so the pages have something to draw.
 *
 * Only this number gets a wallet, orders, addresses and a rejected
 * verification. Signing in with any other creates an empty account — which is
 * not an oversight but the point: the empty wallet, the address list with
 * nothing in it and the unstarted verification are states the design draws and
 * a shop has to get right.
 */
export function seed(store: Tables): void {
  if (!accountsAvailable()) return;

  const joinedAt = '2026-03-04T09:12:00.000Z';
  const customer: CustomerRecord = {
    id: '01997d1a-4c8e-7a31-9f60-2b5c7d0e41aa',
    mobile: DEMO_MOBILE,
    displayName: null,
    nationalId: null,
    birthDate: null,
    iban: null,
    kycStatus: 'rejected',
    kycRejectionReason: 'تصویر ارسالی خوانا نبود. لطفاً در نور کافی و بدون عینک دوباره ارسال کنید.',
    selfieChallenge: null,
    selfieSubmittedAt: null,
    passwordHash: null,
    joinedAt,
    // ۴٬۸۲۰٬۰۰۰ تومان, held as the rials it actually is.
    walletRials: 48_200_000n,
    walletUpdatedAt: '2026-09-08T18:40:00.000Z',
    goldMilligrams: 3_200n,
    favouriteCount: 7,
    unreadMessageCount: 1,
  };

  store.customers.set(customer.id, customer);
  store.byMobile.set(customer.mobile, customer.id);

  const addresses: readonly AddressRecord[] = [
    {
      id: '01997d1a-4c8e-7a31-9f60-2b5c7d0e41b1',
      customerId: customer.id,
      label: 'home',
      recipientName: 'کاربر زرنما',
      recipientMobile: DEMO_MOBILE,
      province: 'تهران',
      city: 'تهران',
      line: 'سعادت‌آباد، خیابان علامه شمالی، کوچه ۱۸',
      plate: '۷',
      unit: '۴',
      postalCode: '1997845613',
      isDefault: true,
    },
    {
      id: '01997d1a-4c8e-7a31-9f60-2b5c7d0e41b2',
      customerId: customer.id,
      label: 'work',
      recipientName: 'کاربر زرنما',
      recipientMobile: DEMO_MOBILE,
      province: 'تهران',
      city: 'تهران',
      line: 'بازار بزرگ، سرای طلا، طبقه دوم',
      plate: '۱۴',
      unit: null,
      postalCode: '1194733109',
      isDefault: false,
    },
  ];

  for (const address of addresses) store.addresses.set(address.id, address);

  store.orders.push(
    {
      customerId: customer.id,
      code: 'ZN-88412',
      placedAt: '2026-08-12T11:20:00.000Z',
      state: 'processing',
      title: 'انگشتر طلا ۱۸ عیار تک‌نگین کلاسیک',
      totalRials: 324_600_000n,
      productSlug: 'classic-solitaire-ring',
      itemCount: 1,
    },
    {
      customerId: customer.id,
      code: 'ZN-87204',
      placedAt: '2026-07-31T07:05:00.000Z',
      state: 'delivered',
      title: 'گوشواره حلقه‌ای پیچ ۱۸ عیار',
      totalRials: 268_000_000n,
      productSlug: null,
      itemCount: 1,
    },
    {
      customerId: customer.id,
      code: 'ZN-85991',
      placedAt: '2026-07-18T15:44:00.000Z',
      state: 'cancelled',
      title: 'نیم‌ست قلب رزگلد',
      totalRials: 538_000_000n,
      productSlug: null,
      itemCount: 2,
    },
  );

  // Two devices that signed in earlier, so «دستگاه‌های فعال» has something to
  // list before the current one is added to it.
  const past: readonly SessionRecord[] = [
    {
      id: '01997d1a-4c8e-7a31-9f60-2b5c7d0e41c1',
      customerId: customer.id,
      tokenHash: 'seed-desktop',
      createdAt: '2026-09-07T09:00:00.000Z',
      lastSeenAt: '2026-09-07T09:40:00.000Z',
      expiresAt: '2026-11-07T09:00:00.000Z',
      revokedAt: null,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/140.0',
      place: 'تهران',
    },
    {
      id: '01997d1a-4c8e-7a31-9f60-2b5c7d0e41c2',
      customerId: customer.id,
      tokenHash: 'seed-app',
      createdAt: '2026-08-27T19:12:00.000Z',
      lastSeenAt: '2026-08-27T19:30:00.000Z',
      expiresAt: '2026-10-27T19:12:00.000Z',
      revokedAt: null,
      userAgent: 'Zarnama/1.4 (Android 15)',
      place: 'کرج',
    },
  ];

  for (const session of past) store.sessions.set(session.tokenHash, session);

  // A basket with something in it, so the cart screens have the states the
  // design draws: a line whose stock is nearly gone, a line with more than one
  // of it, and a saved piece that can no longer be ordered.
  const basketAt = '2026-09-10T17:05:00.000Z';
  const line = (id: string, productSlug: string, size: number | null, quantity: number) => ({
    id,
    productSlug,
    size,
    colour: 'yellow' as const,
    quantity,
    addedAt: basketAt,
  });

  store.carts.set(customer.id, {
    customerId: customer.id,
    lines: [
      line('01997d1a-4c8e-7a31-9f60-2b5c7d0e4201', 'classic-solitaire-ring', 54, 1),
      line('01997d1a-4c8e-7a31-9f60-2b5c7d0e4202', 'delicate-band-ring', 56, 2),
      line('01997d1a-4c8e-7a31-9f60-2b5c7d0e4203', 'stone-set-dress-ring', 56, 1),
    ],
    saved: [
      line('01997d1a-4c8e-7a31-9f60-2b5c7d0e4211', 'paired-wedding-bands', 58, 1),
      line('01997d1a-4c8e-7a31-9f60-2b5c7d0e4212', 'rose-gold-solitaire-ring', 54, 1),
    ],
    discountCode: null,
    ratePerGramRials: getGoldRate().pricePerGram18k,
    // Struck when the tables were built, so the lock counts down from a full
    // window on a fresh development server rather than from an expired one.
    rateQuotedAt: new Date().toISOString(),
    updatedAt: basketAt,
  });
}
