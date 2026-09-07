/**
 * GENERATED FILE — DO NOT EDIT.
 *
 * Produced by scripts/generate-component-contracts.mjs from
 * design-system/_adherence.oxlintrc.json, which is the design system’s own
 * machine-readable statement of each component’s API.
 *
 * To change anything here, re-import the adherence config and regenerate:
 *   pnpm --filter @sharghigold/ui generate:contracts
 */

/** Every component the design system declares a contract for. */
export const COMPONENT_NAMES = [
  'Alert',
  'Avatar',
  'Badge',
  'Button',
  'Checkbox',
  'Crumb',
  'IconButton',
  'Input',
  'Modal',
  'NavItem',
  'OrderStepper',
  'OtpInput',
  'Pagination',
  'PriceChange',
  'PriceInput',
  'PriceLockCountdown',
  'PriceRow',
  'ProductCard',
  'QuantityStepper',
  'RadioGroup',
  'SearchField',
  'Select',
  'Skeleton',
  'Spinner',
  'StatTile',
  'Switch',
  'TabItem',
  'Tag',
  'TickerItem',
  'Toast',
  'Tooltip',
  'WalletCard',
] as const;

export type ComponentName = (typeof COMPONENT_NAMES)[number];

export const ALERT_VARIANTS = ['info', 'success', 'warning', 'danger'] as const;
export type AlertVariant = (typeof ALERT_VARIANTS)[number];

/** Props `<Alert>` declares. React intrinsics are excluded. */
export type AlertPropName = 'variant' | 'title' | 'icon';

export const AVATAR_VARIANTS = ['default', 'gold'] as const;
export type AvatarVariant = (typeof AVATAR_VARIANTS)[number];

/** Props `<Avatar>` declares. React intrinsics are excluded. */
export type AvatarPropName = 'name' | 'src' | 'size' | 'variant';

export const BADGE_VARIANTS = ['neutral', 'primary', 'gold', 'success', 'danger', 'warning', 'info', 'solid-danger', 'solid-gold'] as const;
export type BadgeVariant = (typeof BADGE_VARIANTS)[number];

/** Props `<Badge>` declares. React intrinsics are excluded. */
export type BadgePropName = 'variant' | 'dot' | 'icon';

export const BUTTON_SIZES = ['sm', 'md', 'lg'] as const;
export type ButtonSize = (typeof BUTTON_SIZES)[number];

export const BUTTON_VARIANTS = ['primary', 'gold', 'secondary', 'ghost', 'destructive'] as const;
export type ButtonVariant = (typeof BUTTON_VARIANTS)[number];

/** Props `<Button>` declares. React intrinsics are excluded. */
export type ButtonPropName = 'variant' | 'size' | 'block' | 'loading' | 'disabled' | 'startIcon' | 'endIcon';

/** Props `<Checkbox>` declares. React intrinsics are excluded. */
export type CheckboxPropName = 'label' | 'description' | 'checked' | 'indeterminate';

/** Props `<Crumb>` declares. React intrinsics are excluded. */
export type CrumbPropName = 'label' | 'href';

export const ICON_BUTTON_SIZES = ['sm', 'md', 'lg'] as const;
export type IconButtonSize = (typeof ICON_BUTTON_SIZES)[number];

export const ICON_BUTTON_VARIANTS = ['ghost', 'solid', 'outline'] as const;
export type IconButtonVariant = (typeof ICON_BUTTON_VARIANTS)[number];

/** Props `<IconButton>` declares. React intrinsics are excluded. */
export type IconButtonPropName = 'icon' | 'label' | 'variant' | 'size';

export const INPUT_SIZES = ['sm', 'md', 'lg'] as const;
export type InputSize = (typeof INPUT_SIZES)[number];

/** Props `<Input>` declares. React intrinsics are excluded. */
export type InputPropName = 'label' | 'optional' | 'required' | 'size' | 'helperText' | 'error' | 'startAdornment' | 'endAdornment';

export const MODAL_SIZES = ['sm', 'md', 'lg'] as const;
export type ModalSize = (typeof MODAL_SIZES)[number];

/** Props `<Modal>` declares. React intrinsics are excluded. */
export type ModalPropName = 'open' | 'onClose' | 'title' | 'footer' | 'size';

/** Props `<NavItem>` declares. React intrinsics are excluded. */
export type NavItemPropName = 'label' | 'href';

/** Props `<OrderStepper>` declares. React intrinsics are excluded. */
export type OrderStepperPropName = 'steps' | 'current';

/** Props `<OtpInput>` declares. React intrinsics are excluded. */
export type OtpInputPropName = 'length' | 'value' | 'onChange' | 'error' | 'autoFocus';

/** Props `<Pagination>` declares. React intrinsics are excluded. */
export type PaginationPropName = 'page' | 'total' | 'onChange';

/** Props `<PriceChange>` declares. React intrinsics are excluded. */
export type PriceChangePropName = 'value' | 'suffix' | 'bare';

export const PRICE_INPUT_SIZES = ['md', 'lg'] as const;
export type PriceInputSize = (typeof PRICE_INPUT_SIZES)[number];

/** Props `<PriceInput>` declares. React intrinsics are excluded. */
export type PriceInputPropName = 'label' | 'unit' | 'value' | 'onValueChange' | 'size' | 'error' | 'helperText';

/** Props `<PriceLockCountdown>` declares. React intrinsics are excluded. */
export type PriceLockCountdownPropName = 'seconds' | 'onExpire' | 'label';

/** Props `<PriceRow>` declares. React intrinsics are excluded. */
export type PriceRowPropName = 'name' | 'spec' | 'buy' | 'sell' | 'buyChange';

/** Props `<ProductCard>` declares. React intrinsics are excluded. */
export type ProductCardPropName = 'title' | 'image' | 'specs' | 'price' | 'wasPrice' | 'discountPct' | 'installment' | 'favorite' | 'onFavorite' | 'onAdd' | 'inStock';

export const QUANTITY_STEPPER_SIZES = ['sm', 'md'] as const;
export type QuantityStepperSize = (typeof QUANTITY_STEPPER_SIZES)[number];

/** Props `<QuantityStepper>` declares. React intrinsics are excluded. */
export type QuantityStepperPropName = 'value' | 'min' | 'max' | 'step' | 'onChange' | 'size' | 'unit';

export const RADIO_GROUP_VARIANTS = ['default', 'card'] as const;
export type RadioGroupVariant = (typeof RADIO_GROUP_VARIANTS)[number];

/** Props `<RadioGroup>` declares. React intrinsics are excluded. */
export type RadioGroupPropName = 'name' | 'value' | 'onChange' | 'options' | 'variant' | 'disabled';

export const SEARCH_FIELD_SIZES = ['sm', 'md', 'lg'] as const;
export type SearchFieldSize = (typeof SEARCH_FIELD_SIZES)[number];

/** Props `<SearchField>` declares. React intrinsics are excluded. */
export type SearchFieldPropName = 'value' | 'onClear' | 'size';

/** Props `<Select>` declares. React intrinsics are excluded. */
export type SelectPropName = 'label' | 'options' | 'value' | 'placeholder' | 'error' | 'helperText';

/** Props `<Skeleton>` declares. React intrinsics are excluded. */
export type SkeletonPropName = 'width' | 'height' | 'radius' | 'circle';

/** Props `<Spinner>` declares. React intrinsics are excluded. */
export type SpinnerPropName = 'size' | 'label';

/** Props `<StatTile>` declares. React intrinsics are excluded. */
export type StatTilePropName = 'label' | 'value' | 'unit' | 'icon' | 'change' | 'caption';

/** Props `<Switch>` declares. React intrinsics are excluded. */
export type SwitchPropName = 'label' | 'checked';

/** Props `<TabItem>` declares. React intrinsics are excluded. */
export type TabItemPropName = 'label' | 'count';

/** Props `<Tag>` declares. React intrinsics are excluded. */
export type TagPropName = 'selected' | 'onRemove' | 'onClick';

/** Props `<TickerItem>` declares. React intrinsics are excluded. */
export type TickerItemPropName = 'name' | 'price' | 'change';

export const TOAST_VARIANTS = ['success', 'danger', 'info'] as const;
export type ToastVariant = (typeof TOAST_VARIANTS)[number];

/** Props `<Toast>` declares. React intrinsics are excluded. */
export type ToastPropName = 'variant' | 'onClose';

/** Props `<Tooltip>` declares. React intrinsics are excluded. */
export type TooltipPropName = 'label';

/** Props `<WalletCard>` declares. React intrinsics are excluded. */
export type WalletCardPropName = 'balance' | 'goldGrams' | 'onTopUp' | 'onWithdraw';

/**
 * The whole contract as data, for runtime checks and tooling.
 */
export const COMPONENT_CONTRACTS = {
  Alert: {
    props: ['variant', 'title', 'icon'],
    enums: {
      variant: ['info', 'success', 'warning', 'danger'],
    },
  },
  Avatar: {
    props: ['name', 'src', 'size', 'variant'],
    enums: {
      variant: ['default', 'gold'],
    },
  },
  Badge: {
    props: ['variant', 'dot', 'icon'],
    enums: {
      variant: ['neutral', 'primary', 'gold', 'success', 'danger', 'warning', 'info', 'solid-danger', 'solid-gold'],
    },
  },
  Button: {
    props: ['variant', 'size', 'block', 'loading', 'disabled', 'startIcon', 'endIcon'],
    enums: {
      size: ['sm', 'md', 'lg'],
      variant: ['primary', 'gold', 'secondary', 'ghost', 'destructive'],
    },
  },
  Checkbox: {
    props: ['label', 'description', 'checked', 'indeterminate'],
    enums: {},
  },
  Crumb: {
    props: ['label', 'href'],
    enums: {},
  },
  IconButton: {
    props: ['icon', 'label', 'variant', 'size'],
    enums: {
      size: ['sm', 'md', 'lg'],
      variant: ['ghost', 'solid', 'outline'],
    },
  },
  Input: {
    props: ['label', 'optional', 'required', 'size', 'helperText', 'error', 'startAdornment', 'endAdornment'],
    enums: {
      size: ['sm', 'md', 'lg'],
    },
  },
  Modal: {
    props: ['open', 'onClose', 'title', 'footer', 'size'],
    enums: {
      size: ['sm', 'md', 'lg'],
    },
  },
  NavItem: {
    props: ['label', 'href'],
    enums: {},
  },
  OrderStepper: {
    props: ['steps', 'current'],
    enums: {},
  },
  OtpInput: {
    props: ['length', 'value', 'onChange', 'error', 'autoFocus'],
    enums: {},
  },
  Pagination: {
    props: ['page', 'total', 'onChange'],
    enums: {},
  },
  PriceChange: {
    props: ['value', 'suffix', 'bare'],
    enums: {},
  },
  PriceInput: {
    props: ['label', 'unit', 'value', 'onValueChange', 'size', 'error', 'helperText'],
    enums: {
      size: ['md', 'lg'],
    },
  },
  PriceLockCountdown: {
    props: ['seconds', 'onExpire', 'label'],
    enums: {},
  },
  PriceRow: {
    props: ['name', 'spec', 'buy', 'sell', 'buyChange'],
    enums: {},
  },
  ProductCard: {
    props: ['title', 'image', 'specs', 'price', 'wasPrice', 'discountPct', 'installment', 'favorite', 'onFavorite', 'onAdd', 'inStock'],
    enums: {},
  },
  QuantityStepper: {
    props: ['value', 'min', 'max', 'step', 'onChange', 'size', 'unit'],
    enums: {
      size: ['sm', 'md'],
    },
  },
  RadioGroup: {
    props: ['name', 'value', 'onChange', 'options', 'variant', 'disabled'],
    enums: {
      variant: ['default', 'card'],
    },
  },
  SearchField: {
    props: ['value', 'onClear', 'size'],
    enums: {
      size: ['sm', 'md', 'lg'],
    },
  },
  Select: {
    props: ['label', 'options', 'value', 'placeholder', 'error', 'helperText'],
    enums: {},
  },
  Skeleton: {
    props: ['width', 'height', 'radius', 'circle'],
    enums: {},
  },
  Spinner: {
    props: ['size', 'label'],
    enums: {},
  },
  StatTile: {
    props: ['label', 'value', 'unit', 'icon', 'change', 'caption'],
    enums: {},
  },
  Switch: {
    props: ['label', 'checked'],
    enums: {},
  },
  TabItem: {
    props: ['label', 'count'],
    enums: {},
  },
  Tag: {
    props: ['selected', 'onRemove', 'onClick'],
    enums: {},
  },
  TickerItem: {
    props: ['name', 'price', 'change'],
    enums: {},
  },
  Toast: {
    props: ['variant', 'onClose'],
    enums: {
      variant: ['success', 'danger', 'info'],
    },
  },
  Tooltip: {
    props: ['label'],
    enums: {},
  },
  WalletCard: {
    props: ['balance', 'goldGrams', 'onTopUp', 'onWithdraw'],
    enums: {},
  },
} as const;
