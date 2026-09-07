/**
 * @sharghigold/ui — the Zarnama Gold design system, ported for the storefront.
 *
 * The token layer ships verbatim from Claude Design and is the single source of
 * truth for colour, type, spacing, elevation and motion. Import the stylesheet
 * once at the application root:
 *
 *     import '@sharghigold/ui/styles.css';
 *
 * One deviation from the imported system, documented in tokens/colors.css and
 * enforced by the contrast tests: --color-price is added because the accent
 * gold fails the accessibility floor the system sets for itself when used as
 * text on a light ground.
 */

export {
  AA_LARGE_TEXT,
  AA_NORMAL_TEXT,
  AAA_NORMAL_TEXT,
  ColorError,
  contrastRatio,
  meetsAA,
  PALETTE,
  parseHex,
  relativeLuminance,
  type Rgb,
} from './contrast.js';
