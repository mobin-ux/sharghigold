/**
 * Derive TypeScript component contracts from the design system adherence config.
 *
 * The design system publishes each component's API as oxlint selectors: one
 * rule listing the declared props, and one rule per enum prop listing the
 * allowed literal values. Parsing that is strictly better than hand-writing 32
 * interfaces, because the contract cannot drift from what the design system
 * actually says.
 *
 * Run with `pnpm --filter @sharghigold/ui generate:contracts`.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const SOURCE = new URL('../design-system/_adherence.oxlintrc.json', import.meta.url);
const TARGET = new URL('../src/generated/component-contracts.ts', import.meta.url);

/**
 * Attributes React itself supplies. The design system permits them on every
 * component, but they are not part of any component's own API, so they are
 * excluded from the generated prop lists.
 */
const REACT_INTRINSICS = new Set(['key', 'ref', 'className', 'style', 'children']);

const DECLARED_PROPS_SELECTOR =
  /^JSXOpeningElement\[name\.name='(?<component>\w+)'\] > JSXAttribute > JSXIdentifier/;

const ENUM_SELECTOR =
  /^JSXOpeningElement\[name\.name='(?<component>\w+)'\] > JSXAttribute\[name\.name='(?<prop>\w+)'\] > Literal\[value!=\/\^\(\?:(?<values>[^)]*)\)\$\/\]/;

const DECLARED_PROPS_MESSAGE = /Declared props:\s*(?<props>[^.]+)\./;

/** @returns {Map<string, {props: string[], enums: Record<string, string[]>}>} */
function parseContracts(config) {
  const restricted = config.rules['no-restricted-syntax'];
  if (!Array.isArray(restricted)) {
    throw new Error('Expected a no-restricted-syntax rule array');
  }

  /** @type {Map<string, {props: string[], enums: Record<string, string[]>}>} */
  const components = new Map();

  const ensure = (name) => {
    let entry = components.get(name);
    if (!entry) {
      entry = { props: [], enums: {} };
      components.set(name, entry);
    }
    return entry;
  };

  for (const rule of restricted) {
    if (typeof rule !== 'object' || rule === null) continue;
    const { selector, message } = rule;
    if (typeof selector !== 'string' || typeof message !== 'string') continue;

    const enumMatch = ENUM_SELECTOR.exec(selector);
    if (enumMatch?.groups) {
      const { component, prop, values } = enumMatch.groups;
      ensure(component).enums[prop] = values.split('|').filter(Boolean);
      continue;
    }

    const propsMatch = DECLARED_PROPS_SELECTOR.exec(selector);
    if (propsMatch?.groups) {
      // The message carries the authoritative list; the selector regex also
      // includes React intrinsics, which are not part of the component API.
      const declared = DECLARED_PROPS_MESSAGE.exec(message);
      if (!declared?.groups) {
        throw new Error(`Could not read declared props for ${propsMatch.groups.component}`);
      }
      const props = declared.groups.props
        .split(',')
        .map((prop) => prop.trim())
        .filter((prop) => prop.length > 0 && !REACT_INTRINSICS.has(prop));

      ensure(propsMatch.groups.component).props = [...new Set(props)];
    }
  }

  return components;
}

function pascalCase(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** For a TypeScript union type: 'a' | 'b'. */
function quoteUnion(values) {
  return values.map((value) => `'${value}'`).join(' | ');
}

/** For an array literal: 'a', 'b'. */
function quoteList(values) {
  return values.map((value) => `'${value}'`).join(', ');
}

function render(components) {
  const names = [...components.keys()].toSorted();
  const lines = [];

  lines.push('/**');
  lines.push(' * GENERATED FILE — DO NOT EDIT.');
  lines.push(' *');
  lines.push(' * Produced by scripts/generate-component-contracts.mjs from');
  lines.push(' * design-system/_adherence.oxlintrc.json, which is the design system’s own');
  lines.push(' * machine-readable statement of each component’s API.');
  lines.push(' *');
  lines.push(' * To change anything here, re-import the adherence config and regenerate:');
  lines.push(' *   pnpm --filter @sharghigold/ui generate:contracts');
  lines.push(' */');
  lines.push('');

  lines.push('/** Every component the design system declares a contract for. */');
  lines.push(`export const COMPONENT_NAMES = [`);
  for (const name of names) lines.push(`  '${name}',`);
  lines.push('] as const;');
  lines.push('');
  lines.push('export type ComponentName = (typeof COMPONENT_NAMES)[number];');
  lines.push('');

  for (const name of names) {
    const contract = components.get(name);
    const enumProps = Object.keys(contract.enums).toSorted();

    for (const prop of enumProps) {
      const constName = `${camelToConst(name)}_${camelToConst(prop)}S`;
      lines.push(`export const ${constName} = [${quoteList(contract.enums[prop])}] as const;`);
      lines.push(
        `export type ${pascalCase(name)}${pascalCase(prop)} = (typeof ${constName})[number];`,
      );
      lines.push('');
    }

    if (contract.props.length > 0) {
      lines.push(`/** Props \`<${name}>\` declares. React intrinsics are excluded. */`);
      lines.push(`export type ${pascalCase(name)}PropName = ${quoteUnion(contract.props)};`);
      lines.push('');
    }
  }

  lines.push('/**');
  lines.push(' * The whole contract as data, for runtime checks and tooling.');
  lines.push(' */');
  lines.push('export const COMPONENT_CONTRACTS = {');
  for (const name of names) {
    const contract = components.get(name);
    lines.push(`  ${name}: {`);
    lines.push(`    props: [${quoteList(contract.props)}],`);
    const enumProps = Object.keys(contract.enums).toSorted();
    if (enumProps.length === 0) {
      lines.push('    enums: {},');
    } else {
      lines.push('    enums: {');
      for (const prop of enumProps) {
        lines.push(`      ${prop}: [${quoteList(contract.enums[prop])}],`);
      }
      lines.push('    },');
    }
    lines.push('  },');
  }
  lines.push('} as const;');
  lines.push('');

  return lines.join('\n');
}

function camelToConst(value) {
  return value.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase();
}

export function generate() {
  const config = JSON.parse(readFileSync(fileURLToPath(SOURCE), 'utf8'));
  return render(parseContracts(config));
}

// Only write when invoked directly, so the test can import `generate()`.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const output = generate();
  writeFileSync(fileURLToPath(TARGET), output, 'utf8');
  const componentCount = (output.match(/^  \w+: \{$/gm) ?? []).length;
  process.stdout.write(`Generated contracts for ${String(componentCount)} components\n`);
}
