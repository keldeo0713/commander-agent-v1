# Contributing

## Before starting

1. Read `docs/HLD.md`, `docs/STATUS.md`, the active checkpoint, and accepted ADRs.
2. Confirm the bounded checkpoint or subtask.
3. Inspect existing changes before editing.
4. Do not change goal meanings, legality behavior, or simulation assumptions silently.

## Development

```bash
pnpm install
pnpm check
```

## Pull requests

- Use a feature branch.
- Keep the pull request scoped to one checkpoint or bounded subtask.
- Include tests and evaluation evidence.
- Update `docs/STATUS.md`.
- Add an ADR for structural decisions.
- Open as draft until all checkpoint exit criteria are met.

## Commit style

Use concise imperative messages, for example:

- `establish CP-00 monorepo foundation`
- `add versioned card snapshot schema`
- `model Kenessos activation goal`
