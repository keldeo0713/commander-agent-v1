# Project status

| Field | Value |
|---|---|
| Active checkpoint | CP-00 — Foundation and governance |
| Status | IN_PROGRESS |
| Last updated | 2026-08-20 |
| HLD version | 1.0 |
| Next checkpoint | CP-01 — Versioned card truth |

## Current objective

Establish a reproducible TypeScript monorepo, versioned domain-contract foundation, governance documents, CI, and architectural boundary checks without implementing product behavior prematurely.

## Scope completed

- Approved HLD added as repository source of truth.
- Monorepo and package-boundary design established.
- Run-manifest v1 schema stub and sample defined.
- Local and CI validation commands defined.
- Agent, contribution, checkpoint, and ADR workflows documented.

## Validation evidence

- `node scripts/offline-check.mjs` passed: 20 source files, 18 JSON files, and all 12 package boundaries validated.
- `git diff --check` passed.
- Dependency installation is unavailable in the current restricted network environment, so the complete `pnpm check` remains pending GitHub CI.

## Assumptions

- Node.js 24+ and pnpm 11+ are the initial supported development environment.
- The project begins as a local-first modular TypeScript monolith.
- PostgreSQL, UI framework, job runner, and AI provider packages are intentionally deferred until their checkpoints need them.

## Known limitations

- No card ingestion, legality, deck building, simulation, optimization, or UI behavior exists in CP-00.
- The run manifest is a foundation contract and will gain domain fields through versioned changes.
- `pnpm-lock.yaml` must be generated and committed after the first dependency-enabled install; CI temporarily uses `--no-frozen-lockfile` until then.

## Recommended next action

Publish the feature branch, run the full GitHub CI check, commit the generated dependency lock, and review the draft pull request before beginning CP-01.
