import { NextResponse, type NextRequest } from 'next/server';
import { parseListingQuery } from '@sharghigold/contracts';

import { listProducts } from '@/server/catalogue/listing';

/**
 * How many products a listing query would show.
 *
 * The filter sheet's «نمایش ۱۲ کالا» button says how many results the filters
 * the customer is still choosing would give, before they are applied. The
 * count depends on prices, and prices are computed from the gold rate on the
 * server, so the browser cannot work it out for itself; it asks here.
 *
 * The query goes through the same closed parser as the listing page, so this
 * accepts exactly what a listing URL accepts and nothing else. A category the
 * taxonomy does not contain counts nothing, the same as its page.
 *
 * Only a number comes back, never products: this endpoint exists to label a
 * button, and returning the grid would make it a second listing API with its
 * own caching and paging to keep in step with the first.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const query = parseListingQuery(Object.fromEntries(request.nextUrl.searchParams));
  const { total } = await listProducts({ ...query, page: 1 });

  return NextResponse.json(
    { total },
    {
      headers: {
        // The same for everyone, and it only moves when the catalogue or the
        // rate does. A short shared cache absorbs a customer dragging the
        // price slider back and forth without serving a stale count for long.
        'cache-control': 'public, max-age=0, s-maxage=30, stale-while-revalidate=60',
      },
    },
  );
}
