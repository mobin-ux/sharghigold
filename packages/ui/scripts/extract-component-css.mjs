/**
 * Extract the design system's component CSS out of its own bundle.
 *
 * Every component in `_ds_bundle.js` carries its stylesheet as a template
 * literal and injects it into `document.head` on first render. That works in a
 * client-only React app and is wrong here for two reasons:
 *
 *   1. Server rendering. Next renders these components on the server, where
 *      there is no `document`. The markup would arrive unstyled and only gain
 *      its appearance once the client bundle executed — a visible flash, and a
 *      permanent regression for anything that never hydrates.
 *   2. It makes styling depend on JavaScript. A design system's CSS should be
 *      a stylesheet the browser can fetch, cache and apply on its own.
 *
 * So we lift the CSS out at build time into one stylesheet, byte-for-byte, and
 * the ported components render plain class names against it. Extraction rather
 * than transcription is deliberate: a hand-copied rule is a place for the port
 * to silently drift from the design.
 *
 * Run: pnpm --filter @sharghigold/ui generate:css
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const packageRoot = join(here, '..');

const BUNDLE = join(packageRoot, 'design-system', '_ds_bundle.js');
const OUTPUT = join(packageRoot, 'src', 'styles', 'generated', 'components.css');

/** `// components/forms/Button.jsx` — marks the start of a component's section. */
const SECTION = /^\/\/ (components\/.+\.jsx?)$/;

/** `const CSS = \`` or `const FIELD_CSS = \`` — opens a stylesheet literal. */
const CSS_OPEN = /^const ([A-Z_]*CSS) = `$/;

/**
 * Read the bundle and return every stylesheet in source order, tagged with the
 * component source file it came from.
 */
function extract(source) {
  const lines = source.split('\n');
  const blocks = [];

  let owner = 'unknown';

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    const section = SECTION.exec(line);
    if (section !== null) {
      owner = section[1];
      continue;
    }

    const open = CSS_OPEN.exec(line);
    if (open === null) {
      continue;
    }

    const body = [];
    let cursor = index + 1;
    while (cursor < lines.length && lines[cursor] !== '`;') {
      body.push(lines[cursor]);
      cursor += 1;
    }

    if (cursor === lines.length) {
      throw new Error(`Unterminated CSS literal for ${owner} at line ${index + 1}.`);
    }

    const css = body.join('\n');

    // A template literal with a substitution is JavaScript, not CSS. Nothing in
    // the design system does this today; if that changes, stop rather than
    // silently emit a broken stylesheet.
    if (css.includes('${')) {
      throw new Error(
        `CSS literal for ${owner} contains a substitution; cannot extract statically.`,
      );
    }

    blocks.push({ owner, name: open[1], css });
    index = cursor;
  }

  return blocks;
}

/** Render the whole stylesheet. Pure, so the drift test can compare it. */
export function generate() {
  const blocks = extract(readFileSync(BUNDLE, 'utf8'));

  if (blocks.length === 0) {
    throw new Error('No stylesheets found in the design system bundle.');
  }

  const header = [
    '/* GENERATED FILE — DO NOT EDIT.',
    ' *',
    ' * Produced by scripts/extract-component-css.mjs from',
    " * design-system/_ds_bundle.js, which is the design system's own build output.",
    ' *',
    ' * These rules are copied verbatim. To change one, change it in Claude Design,',
    ' * re-import the bundle and regenerate:',
    ' *   pnpm --filter @sharghigold/ui generate:css',
    ' *',
    ` * ${String(blocks.length)} stylesheets, in bundle order.`,
    ' */',
    '',
  ].join('\n');

  const body = blocks.map((block) => `\n/* ${block.owner} */\n${block.css.trim()}\n`).join('');

  return `${header}${body}`;
}

// Only write when invoked directly, so the drift test can import `generate()`.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const output = generate();
  writeFileSync(OUTPUT, output, 'utf8');
  const count = (output.match(/^\/\* components\//gm) ?? []).length;
  process.stdout.write(`Extracted ${String(count)} stylesheets to ${OUTPUT}\n`);
}
