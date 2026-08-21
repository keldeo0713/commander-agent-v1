# Project status

| Field | Value |
|---|---|
| Active checkpoint | CP-02 — Commander legality engine |
| Status | READY_FOR_REVIEW |
| Last updated | 2026-08-21 |
| HLD version | 1.0 |
| Next checkpoint | CP-03 — Structured deck specification |

## Current objective

Validate Commander deck construction deterministically against a versioned format snapshot with structured, explainable violations.

## Scope completed

- CP-00 merged through pull request #1 with every exit criterion satisfied.
- Scryfall `oracle_cards` and `default_cards` metadata/download client added.
- Provider JSON validation and explicit per-record rejection reports added.
- Oracle-card and printing normalization separated into versioned contracts.
- Immutable dataset manifests, source/normalized SHA-256 hashes, freshness, atomic persistence, and idempotent reimport added.
- Lookup by normalized name, Oracle ID, Scryfall ID, and set/collector number added.
- Kenessos fixtures and deterministic ingestion/catalog tests added.
- Source attribution, refresh policy, command usage, and failure behavior documented.
- CP-01 merged through pull request #2 with every exit criterion satisfied.
- Generic Commander size, commander eligibility, color-identity, singleton, banned-list, companion, and supported-pair validation added.
- Versioned `commander-rules/1` format snapshot and structured violation contracts added.
- Kenessos is used only as a legality regression fixture; no strategy or commander-specific branch exists in the validator.

## Validation evidence

- CP-00 final branch [CI run 6](https://github.com/keldeo0713/commander-agent-v1/actions/runs/32458014249) passed before merge.
- `node scripts/offline-check.mjs` passed locally for CP-01: 32 source files, 20 JSON files, and all 12 package boundaries validated.
- `git diff --check` passed.
- CP-01 [CI run 19](https://github.com/keldeo0713/commander-agent-v1/actions/runs/32462509574) passed the complete `pnpm check` chain and imported the same current Scryfall snapshot twice with identical IDs and hashes.
- Acceptance dataset `scryfall-20260820210532-75809e87b469` contained 38,626 Oracle identities and 116,619 printings. All 81 rejected default-card records were retained as explicit `invalid_record` issues.
- The normalized SHA-256 was `75809e87b46990767407ec4666979e75d36ab98d3881c01f12447ab8100e8aeb`; source hashes were `af0e7fe0657d5075d79ad1c97af820d6dfea7be0470e7d940cc17dbdd9a0bdb5` for 38,626 Oracle records and `60bafbc94807edc33e29346eff7103a25f698bbbb1809cf296bc090dd0727301` for 116,700 default-card records.
- Provider freshness at acceptance was approximately 11.2 hours.
- CP-02 [CI run 23](https://github.com/keldeo0713/commander-agent-v1/actions/runs/32463914254) passed lint, strict typecheck, all 18 tests across 6 files, all 12 package boundaries, and manifest validation.

## Assumptions

- Scryfall `oracle_cards` is authoritative for rules-level identities and `default_cards` supplies printing-level identities and attributes.
- Scryfall bulk object timestamps plus source and normalized hashes define the immutable dataset version.
- PostgreSQL remains deferred; CP-01 persists portable filesystem artifacts behind project contracts.

## Known limitations

- JSONL records are decoded incrementally after gzip decompression; normalized records remain in memory during snapshot construction. The selected live snapshot completed within the acceptance runner's 6 GiB heap allowance.
- Game Changers and bracket guardrails remain later deck-spec/builder scope; they are not format legality failures.
- Prices and image fields are printing facts, but purchasing/market behavior remains out of scope.

## Recommended next action

Review and merge pull request #3, then begin CP-03 from the merged checkpoint.
