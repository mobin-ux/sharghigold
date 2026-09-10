import {
  CalculatorIcon,
  ChatIcon,
  CourierIcon,
  DeliveryIcon,
  InvoiceIcon,
  ReturnIcon,
  RulerIcon,
  ShieldIcon,
  StoreIcon,
  TruckIcon,
} from '@/components/icons';
import type { PolicyIcon as PolicyIconKey } from '@/server/policy/shop-policy';

/**
 * Maps a policy's icon key to the drawing the storefront owns.
 *
 * The same split as the category marks: shop policy is content an editor will
 * choose, and an editor who can choose markup can put markup on every
 * customer's page. So the policy names a key and this decides what it looks
 * like. An unknown key draws nothing rather than collapsing the row it sits in.
 */
const DRAWINGS: Record<PolicyIconKey, (props: { readonly size?: number }) => React.ReactElement> = {
  shield: ShieldIcon,
  invoice: InvoiceIcon,
  truck: TruckIcon,
  return: ReturnIcon,
  delivery: DeliveryIcon,
  store: StoreIcon,
  courier: CourierIcon,
  chat: ChatIcon,
  ruler: RulerIcon,
  calculator: CalculatorIcon,
};

export function PolicyIcon({
  icon,
  size = 18,
}: {
  readonly icon: PolicyIconKey;
  readonly size?: number;
}) {
  const Drawing = DRAWINGS[icon];

  return <Drawing size={size} />;
}
