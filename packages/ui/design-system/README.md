# Imported design-system artefacts

## `_adherence.oxlintrc.json`

Copied from the Zarnama Gold design system project in Claude Design:

```
_ds/zarnama-gold-design-system-e4dd01e6-0b33-4db4-8658-acddf3503ee2/_adherence.oxlintrc.json
```

It encodes every component's prop contract — declared props, and the allowed
literal values for enum props — as lint selectors. That makes it a
machine-readable API specification, which is why it is checked in rather than
summarised.

`scripts/generate-component-contracts.mjs` parses this file and emits
`src/generated/component-contracts.ts`. The generated file is committed so
consumers do not need to run the generator, and a test regenerates it and
compares, so the two cannot drift.

### Deviation from the source file

The trailing `x-omelette` metadata block is **not** copied. It lists every
design token and its kind, which is information the CSS in `src/styles/tokens/`
already carries authoritatively. Everything under `plugins`, `rules` and
`overrides` is verbatim.

## Re-importing

When the design system changes upstream, replace this file and run:

```
pnpm --filter @sharghigold/ui generate:contracts
```

Review the diff in `src/generated/component-contracts.ts`: it is the exact set
of API changes the design system made.
