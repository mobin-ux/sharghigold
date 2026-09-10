'use client';

import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { GoldColour, PriceQuote, ProductDetail } from '@sharghigold/contracts';

import { persianCount } from '@/lib/product-view';

/**
 * What the customer has chosen, and how long the price is good for.
 *
 * The colour picker, the size picker, the buy bar and the confirmation sheet
 * are in four different places in the document, with server-rendered sections
 * between them, so they cannot be one component. They do share one piece of
 * state, and this is it — a single provider rather than four islands each
 * holding its own idea of which size is selected.
 *
 * It also owns the price-lock countdown, for the same reason: the figure
 * appears twice on the page, and two components each running their own
 * interval would drift apart within a minute of each other.
 *
 * None of this is authority. A selection here is what gets *sent* when an
 * order is placed; whether that size can be sold, and what it costs, are
 * decided by the server against stock and a fresh quote (rules 15 and 17).
 */

type Sheet = 'none' | 'size-guide' | 'checkout';

interface PurchaseState {
  readonly colour: GoldColour;
  readonly size: number | null;
  readonly sheet: Sheet;
  /** Whole seconds until the quoted price expires. Zero means it has. */
  readonly secondsRemaining: number;
  readonly setColour: (colour: GoldColour) => void;
  readonly setSize: (size: number) => void;
  readonly openSizeGuide: () => void;
  readonly openCheckout: () => void;
  readonly closeSheet: () => void;
}

const PurchaseContext = createContext<PurchaseState | null>(null);

export function usePurchase(): PurchaseState {
  const value = useContext(PurchaseContext);

  if (value === null) {
    // A hard failure rather than a default: a buy bar rendered outside the
    // provider would show a price with nothing selected behind it.
    throw new Error('usePurchase must be used inside <PurchaseProvider>');
  }

  return value;
}

/** The size a customer starts on: 54 when it is available, else the first that is. */
function defaultSize(product: ProductDetail): number | null {
  const available = product.sizes.filter((size) => size.available);
  if (available.length === 0) return null;

  return (available.find((size) => size.value === 54) ?? available[0])?.value ?? null;
}

function defaultColour(product: ProductDetail): GoldColour {
  const [first] = product.colours;
  return (product.colours.find((colour) => colour.available) ?? first)?.colour ?? 'yellow';
}

export function PurchaseProvider({
  product,
  quote,
  children,
}: {
  readonly product: ProductDetail;
  readonly quote: PriceQuote;
  readonly children: ReactNode;
}) {
  const router = useRouter();

  const [colour, setColour] = useState<GoldColour>(() => defaultColour(product));
  const [size, setSize] = useState<number | null>(() => defaultSize(product));
  const [sheet, setSheet] = useState<Sheet>('none');

  // Seeded from the server's own count so the first client render produces the
  // same string the server sent. Deriving it from `Date.now()` instead is a
  // hydration mismatch on the most important number on the page.
  //
  // The quote it belongs to is held beside it, so a fresh quote resets the
  // count during render rather than in an effect. An effect would paint the
  // old figure once before correcting it, which on a price is exactly the
  // frame nobody should see.
  const [lock, setLock] = useState({
    expiresAt: quote.expiresAt,
    seconds: quote.secondsRemaining,
  });

  const { expiresAt } = quote;

  if (lock.expiresAt !== expiresAt) {
    setLock({ expiresAt, seconds: quote.secondsRemaining });
  }

  useEffect(() => {
    const deadline = Date.parse(expiresAt);

    const tick = () => {
      // Computed from the deadline rather than decremented, so a tab that was
      // backgrounded for two minutes comes back showing the truth instead of
      // two minutes of missed ticks.
      const left = Math.max(0, Math.round((deadline - Date.now()) / 1_000));
      setLock({ expiresAt, seconds: left });

      if (left === 0) {
        clearInterval(timer);
        // Ask the server for a new quote. The alternative — leaving the
        // expired figure on screen — is showing a price the shop will not
        // honour.
        router.refresh();
      }
    };

    const timer = setInterval(tick, 1_000);
    return () => clearInterval(timer);
  }, [expiresAt, router]);

  const value = useMemo<PurchaseState>(
    () => ({
      colour,
      size,
      sheet,
      secondsRemaining: lock.seconds,
      setColour,
      setSize,
      openSizeGuide: () => setSheet('size-guide'),
      openCheckout: () => setSheet('checkout'),
      closeSheet: () => setSheet('none'),
    }),
    [colour, size, sheet, lock.seconds],
  );

  return <PurchaseContext value={value}>{children}</PurchaseContext>;
}

/**
 * The chosen variant in words: «۱۸ عیار · ۲٫۸۰ گرم · طلای زرد · سایز ۵۴».
 *
 * Assembled from labels the server sent, so a colour renamed in the admin
 * panel is renamed here too.
 */
export function useChosenSummary(product: ProductDetail, prefix: string): string {
  const { colour, size } = usePurchase();

  return useMemo(() => {
    const chosen = product.colours.find((option) => option.colour === colour);
    const parts = [prefix];

    if (chosen !== undefined) parts.push(`طلای ${chosen.label}`);
    if (size !== null) parts.push(`سایز ${persianCount(size)}`);

    return parts.join(' · ');
  }, [colour, prefix, product.colours, size]);
}
