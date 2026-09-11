import type { AddressLabel } from '@sharghigold/contracts';

/**
 * What the address form and its action pass back and forth.
 *
 * Separate from `actions.ts` because a `'use server'` module may only export
 * async functions.
 */

export interface AddressDraftFields {
  readonly id: string;
  readonly province: string;
  readonly city: string;
  readonly line: string;
  readonly plate: string;
  readonly unit: string;
  readonly postalCode: string;
  readonly label: AddressLabel;
  readonly isDefault: boolean;
  readonly deliverToSelf: boolean;
  readonly recipientName: string;
  readonly recipientMobile: string;
}

/** Which field a message belongs under, or `form` for the summary. */
export type AddressField =
  'line' | 'plate' | 'postalCode' | 'recipientName' | 'recipientMobile' | 'region' | 'form';

export type AddressState =
  | { readonly status: 'idle'; readonly draft: AddressDraftFields }
  | {
      readonly status: 'invalid';
      readonly message: string;
      readonly field: AddressField;
      readonly draft: AddressDraftFields;
    };

export const EMPTY_ADDRESS: AddressDraftFields = {
  id: '',
  province: 'تهران',
  city: 'تهران',
  line: '',
  plate: '',
  unit: '',
  postalCode: '',
  label: 'home',
  isDefault: false,
  deliverToSelf: true,
  recipientName: '',
  recipientMobile: '',
};
