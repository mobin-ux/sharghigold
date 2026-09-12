# @sharghigold/contracts

The wire format between the apps, as Zod 4 schemas plus inferred types. The
only workspace that depends on `zod`.

- One file per domain in `src/` (`account`, `admin`, `api`, `auth`, `cart`,
  `catalogue`, `listing`, `pagination`, `pricing`, `product`, `reviews`,
  `wallet`); shared scalars in `primitives.ts`. Export everything through
  `src/index.ts`.
- Naming: `fooSchema` and `type Foo = z.infer<typeof fooSchema>`.
- Money and weights are digit strings on the wire (`rialsStringSchema` and
  friends in `primitives.ts`), never `number`.
- Input schemas never carry a price, total or rate; the server derives those.
- Query-string parsers are closed: an unknown value falls back to the default,
  it never widens a result.

After a change: `pnpm --filter @sharghigold/contracts build` so the apps see it.
