import { permanentRedirect } from 'next/navigation';

import { routes } from '@/lib/routes';

/**
 * «پیگیری سفارش» in the footer pointed here, and nothing was here.
 *
 * An order belongs to an account, so tracking one is the account's order list.
 * A permanent redirect rather than a copy of that page: two addresses for one
 * screen is two screens to keep in step, and a crawler that has already seen
 * `/orders` is told where it went.
 */
export default function OrdersRedirect(): never {
  permanentRedirect(routes.accountOrders());
}
