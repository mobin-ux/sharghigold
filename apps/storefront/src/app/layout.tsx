import type { Metadata, Viewport } from 'next';

import { BRAND, SITE } from '@/config/brand';

// Design system token layer first: it defines the custom properties every
// app-level rule below depends on.
import '@sharghigold/ui/styles.css';

import './globals.css';

// Chrome shared by every route (tab bar, basket bubble). Loaded here rather
// than from a page so a shared component is styled wherever it is mounted.
import './shell.css';

/**
 * Root layout.
 *
 * `lang` and `dir` are set on the html element rather than on a wrapper, so
 * bidirectional text, form controls and scrollbars all resolve correctly
 * without per-component overrides. Everything below this point can then use
 * logical CSS properties and simply work in RTL.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${BRAND.name} — ${BRAND.tagline}`,
    template: `%s | ${BRAND.name}`,
  },
  description: SITE.description,
  applicationName: BRAND.name,
  openGraph: {
    type: 'website',
    locale: SITE.locale,
    siteName: BRAND.name,
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: SITE.description,
  },
  robots: {
    // Product pages must be crawlable; this is the site-wide default.
    index: true,
    follow: true,
  },
  formatDetection: {
    // Persian digits in prices are not phone numbers, and Safari will happily
    // turn them into tel: links if allowed to guess.
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Deliberately not capping zoom: pinch-zoom is an accessibility affordance.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAF8F4' },
    { media: '(prefers-color-scheme: dark)', color: '#101F1D' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): React.ReactElement {
  return (
    <html lang={SITE.lang} dir={SITE.direction}>
      <body>{children}</body>
    </html>
  );
}
