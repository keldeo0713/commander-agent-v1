# Agent working agreement

## Required reading

Before changing the project, read:

1. `docs/HLD.md`
2. `docs/STATUS.md`
3. `docs/CHECKPOINTS.md`
4. Accepted records under `docs/adr/`

## Scope

- Work on one checkpoint or explicitly bounded subtask at a time.
- Preserve user-authored and unrelated changes.
- Do not reinterpret product goals without recording and approving the decision.
- Domain code must not depend on application or integration code.
- Keep external provider types outside domain packages.

## Validation

Run `pnpm check` before handoff. Probability or optimization claims must include the exact dataset, schema, engine, policy, scenario, and seed versions used.

## Handoff

Update `docs/STATUS.md` with scope, changed modules, validation evidence, assumptions, limitations, and the safest next action. Do not mark a checkpoint complete unless every exit criterion is met.
