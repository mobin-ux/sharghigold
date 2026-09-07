import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

// @ts-expect-error -- build script, plain JS with JSDoc types
import { generate } from '../../scripts/generate-component-contracts.mjs';
import {
  BADGE_VARIANTS,
  BUTTON_SIZES,
  BUTTON_VARIANTS,
  COMPONENT_CONTRACTS,
  COMPONENT_NAMES,
  TOAST_VARIANTS,
} from '../generated/component-contracts.js';

describe('generated contracts stay in step with the design system', () => {
  it('the committed file matches what the generator produces', () => {
    // If this fails, someone edited the generated file by hand or changed the
    // adherence config without regenerating. Run:
    //   pnpm --filter @sharghigold/ui generate:contracts
    const committed = readFileSync(
      fileURLToPath(new URL('../generated/component-contracts.ts', import.meta.url)),
      'utf8',
    );
    expect((generate as () => string)()).toBe(committed);
  });
});

describe('component contracts', () => {
  it('covers every component the design system declares', () => {
    expect(COMPONENT_NAMES).toHaveLength(32);
    expect(Object.keys(COMPONENT_CONTRACTS)).toHaveLength(COMPONENT_NAMES.length);
  });

  it('reproduces the Button contract exactly', () => {
    expect(BUTTON_VARIANTS).toEqual(['primary', 'gold', 'secondary', 'ghost', 'destructive']);
    expect(BUTTON_SIZES).toEqual(['sm', 'md', 'lg']);
    expect(COMPONENT_CONTRACTS.Button.props).toEqual([
      'variant',
      'size',
      'block',
      'loading',
      'disabled',
      'startIcon',
      'endIcon',
    ]);
  });

  it('reproduces the ProductCard contract, including the affordances the homepage omits', () => {
    // The rendered homepage shows no wishlist or add-to-cart control, but the
    // design system declares both. Keeping them visible here makes that a
    // deliberate product decision rather than an oversight.
    expect(COMPONENT_CONTRACTS.ProductCard.props).toContain('favorite');
    expect(COMPONENT_CONTRACTS.ProductCard.props).toContain('onFavorite');
    expect(COMPONENT_CONTRACTS.ProductCard.props).toContain('onAdd');
    expect(COMPONENT_CONTRACTS.ProductCard.props).toContain('installment');
    expect(COMPONENT_CONTRACTS.ProductCard.props).toContain('wasPrice');
    expect(COMPONENT_CONTRACTS.ProductCard.props).toContain('discountPct');
  });

  it('keeps the gold-specific pricing components in the contract', () => {
    expect(COMPONENT_CONTRACTS.PriceLockCountdown.props).toEqual(['seconds', 'onExpire', 'label']);
    expect(COMPONENT_CONTRACTS.PriceChange.props).toEqual(['value', 'suffix', 'bare']);
    expect(COMPONENT_CONTRACTS.PriceRow.props).toEqual([
      'name',
      'spec',
      'buy',
      'sell',
      'buyChange',
    ]);
  });

  it('keeps semantic variants semantic', () => {
    // Toast has no 'warning': the design system reserves warning for Alert.
    expect(TOAST_VARIANTS).toEqual(['success', 'danger', 'info']);
    expect(BADGE_VARIANTS).toContain('solid-gold');
    expect(BADGE_VARIANTS).toContain('solid-danger');
  });

  it('excludes React intrinsics from every declared prop list', () => {
    const intrinsics = ['className', 'style', 'ref', 'children'];
    for (const [name, contract] of Object.entries(COMPONENT_CONTRACTS)) {
      for (const intrinsic of intrinsics) {
        expect(
          contract.props,
          `${name} should not declare the React intrinsic ${intrinsic}`,
        ).not.toContain(intrinsic);
      }
    }
  });

  it('gives every component at least one declared prop or enum', () => {
    for (const [name, contract] of Object.entries(COMPONENT_CONTRACTS)) {
      const hasSomething = contract.props.length > 0 || Object.keys(contract.enums).length > 0;
      expect(hasSomething, `${name} parsed to an empty contract`).toBe(true);
    }
  });

  it('lists enum values that are all present in the prop list where applicable', () => {
    for (const [name, contract] of Object.entries(COMPONENT_CONTRACTS)) {
      for (const prop of Object.keys(contract.enums)) {
        expect(
          contract.props,
          `${name}.${prop} has allowed values but is not a declared prop`,
        ).toContain(prop);
      }
    }
  });
});
