import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

// @ts-expect-error -- build script, plain JS with JSDoc types
import { generate } from '../../scripts/extract-component-css.mjs';
import { PERSIAN_DECIMAL_SEPARATOR, toPersianDigits } from '../intl.js';

const committed = readFileSync(
  fileURLToPath(new URL('../styles/generated/components.css', import.meta.url)),
  'utf8',
);

describe('component stylesheet stays in step with the design system', () => {
  it('the committed file matches what the extractor produces', () => {
    // If this fails, someone edited the generated stylesheet by hand or
    // re-imported the design system bundle without regenerating. Run:
    //   pnpm --filter @sharghigold/ui generate:css
    expect((generate as () => string)()).toBe(committed);
  });

  it('carries the rules the ported components render against', () => {
    // Each of these class names is written by hand in a .tsx file. If the
    // design system renames one, the component keeps compiling and silently
    // loses its styling — which is exactly the failure this catches.
    for (const selector of [
      '.zn-badge',
      '.zn-btn',
      '.zn-iconbtn',
      '.zn-pchg',
      '.zn-ticker',
      '.zn-pcard',
      '.zn-pcard__title',
      '.zn-pcard__specs',
      '.zn-pcard__now',
      '.zn-pcard__was',
      '.zn-pcard__badges',
      '.zn-pcard__foot',
    ]) {
      expect(committed, `missing ${selector}`).toContain(`${selector}{`);
    }
  });

  it('carries every variant the contracts allow', () => {
    for (const variant of ['neutral', 'gold', 'solid-danger', 'solid-gold']) {
      expect(committed).toContain(`.zn-badge--${variant}{`);
    }
    for (const variant of ['gold', 'secondary', 'ghost', 'destructive']) {
      expect(committed).toContain(`.zn-btn--${variant}{`);
    }
    for (const size of ['sm', 'md', 'lg']) {
      expect(committed).toContain(`.zn-btn--${size}{`);
    }
  });

  it('contains no JavaScript that survived extraction', () => {
    // The extractor refuses template substitutions, but a stray backtick or a
    // `const` line would mean the block boundaries were misread.
    expect(committed).not.toContain('${');
    expect(committed).not.toContain('`');
    expect(committed).not.toMatch(/^(const|function|export) /m);
  });
});

describe('Persian numerals', () => {
  it('converts ASCII digits', () => {
    expect(toPersianDigits('2026')).toBe('۲۰۲۶');
    expect(toPersianDigits(15)).toBe('۱۵');
  });

  it('uses the Persian decimal separator rather than a full stop', () => {
    // The design system's own helper leaves the ASCII '.' in place, producing
    // «۰.۸» — Persian numerals with a Latin decimal mark.
    expect(toPersianDigits('0.8')).toBe(`۰${PERSIAN_DECIMAL_SEPARATOR}۸`);
    expect(toPersianDigits('0.8')).not.toContain('.');
  });

  it('leaves non-numeric text alone', () => {
    expect(toPersianDigits('۱۸ عیار')).toBe('۱۸ عیار');
    expect(toPersianDigits('گرم')).toBe('گرم');
  });
});
