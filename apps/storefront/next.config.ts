import type { NextConfig } from 'next';

/**
 * Security headers for the storefront.
 *
 * These are separate from, and looser than, the API's. The API serves only
 * JSON and denies everything; this process serves HTML and must permit its own
 * scripts and styles — but nothing else.
 */
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Next injects inline bootstrap scripts. 'unsafe-inline' is required
      // until a nonce-based policy is wired through the app; tracked below.
      "script-src 'self' 'unsafe-inline'",
      // Styles are CSS files plus the inline style attributes React emits.
      "style-src 'self' 'unsafe-inline'",
      // Fonts are self-hosted from /fonts; no external font CDN.
      "font-src 'self'",
      "img-src 'self' data: blob:",
      // The API origin is added here once it is deployed behind a real host.
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      'upgrade-insecure-requests',
    ].join('; '),
  },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    // Nothing here needs a camera, a microphone or a location.
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Do not advertise the framework version.
  poweredByHeader: false,

  // A build that type-errors must fail, not ship.
  typescript: { ignoreBuildErrors: false },

  transpilePackages: ['@sharghigold/ui', '@sharghigold/money', '@sharghigold/contracts'],

  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        // Self-hosted fonts are immutable: the filename changes when the font
        // does, so a long cache is safe and saves a request on every visit.
        source: '/fonts/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};

export default nextConfig;
