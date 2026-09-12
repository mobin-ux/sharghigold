import { NextResponse } from 'next/server';

import { cartItemCount } from '@/server/cart/cart';
import { getViewer } from '@/server/account/session';

/**
 * How many pieces are in the caller's basket.
 *
 * The badge on the basket icon is in the header and the tab bar of every
 * screen. Rendering it on the server would mean reading the session on every
 * request, which makes the homepage — and every catalogue page — uncacheable
 * for everyone in order to draw one bubble. So the count is fetched by a
 * client island instead, and this is what it fetches.
 *
 * The hook it serves returned a hard-coded zero from the day the header was
 * built, with a comment saying the basket service did not exist. It does now,
 * so a customer with three pieces in their basket was being shown an empty
 * one on every page.
 *
 * There is no identifier in this URL and none is accepted. The basket is
 * resolved from the session cookie, so there is nothing to tamper with and no
 * other customer's basket to ask for. Signed out is a count of zero rather
 * than a 401: the header asks for this on every page, and a redirect to the
 * sign-in screen because a bubble wanted a number would be absurd.
 */
export async function GET(): Promise<NextResponse> {
  const viewer = await getViewer();
  const count = viewer === undefined ? 0 : cartItemCount(viewer);

  return NextResponse.json(
    { count },
    {
      headers: {
        // Per-customer and changes the moment they add something. A shared
        // cache holding this would show one customer another's basket count.
        'cache-control': 'no-store, private',
      },
    },
  );
}
