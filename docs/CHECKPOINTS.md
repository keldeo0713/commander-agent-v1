# Delivery checkpoints

The detailed objectives and exit criteria live in `docs/HLD.md`. This file is the execution ledger.

| Checkpoint | Name | Status | Evidence |
|---|---|---|---|
| CP-00 | Foundation and governance | COMPLETE | [Merged PR #1](https://github.com/keldeo0713/commander-agent-v1/pull/1), [CI run 6](https://github.com/keldeo0713/commander-agent-v1/actions/runs/32458014249) |
| CP-01 | Versioned card truth | IN_PROGRESS | `feature/cp-01-versioned-card-truth` |
| CP-02 | Commander legality engine | NOT_STARTED | — |
| CP-03 | Structured deck specification | NOT_STARTED | — |
| CP-04 | Functional knowledge and candidate retrieval | NOT_STARTED | — |
| CP-05 | Kenessos setup and commander-removal simulator | NOT_STARTED | — |
| CP-06 | Baseline builder and optimizer | NOT_STARTED | — |
| CP-07 | End-to-end AI adviser | NOT_STARTED | — |
| CP-08 | User application and Archidekt export | NOT_STARTED | — |
| CP-09 | Generalization | NOT_STARTED | — |
| CP-10 | Interaction models and operational scaling | NOT_STARTED | — |

## CP-00 exit checklist

- [x] Monorepo structure and package boundaries exist.
- [x] HLD, status, checkpoint ledger, and ADR template exist.
- [x] Shared schema/version conventions are represented in code.
- [x] CI is configured for lint, typecheck, tests, boundary checks, and manifest validation.
- [x] Fresh install and `pnpm check` succeed.
- [x] Boundary checks prove domain cannot import integration/application packages.
- [x] Sample run manifest validates.
- [x] Product implementation is deferred to later checkpoints.

Do not mark CP-00 complete until every item is checked and review evidence is linked.

## CP-01 exit checklist

- [x] Scryfall snapshot downloader and normalizer exist.
- [x] Oracle identities and printing identities are separated.
- [x] Dataset metadata, hashes, freshness, and rejected-record reports exist.
- [x] Lookup by name and source identifiers exists.
- [ ] A current selected Scryfall snapshot imports fully or every rejected record is reported.
- [x] Reimport is idempotent in deterministic fixtures.
- [x] Kenessos resolves to one Oracle identity with the expected reference facts.
- [x] Source attribution and refresh policy are documented.
- [ ] Full `pnpm check` and CP-01 CI pass.
