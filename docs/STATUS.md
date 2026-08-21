# Project status

| Field | Value |
|---|---|
| Active checkpoint | CP-01 — Versioned card truth |
| Status | IN_PROGRESS |
| Last updated | 2026-08-21 |
| HLD version | 1.0 |
| Next checkpoint | CP-02 — Commander legality engine |

## Current objective

Ingest Scryfall Oracle and printing snapshots into immutable, content-addressed datasets with explicit failures, reproducibility metadata, and deterministic lookup contracts.

## Scope completed

- CP-00 merged through pull request #1 with every exit criterion satisfied.
- Scryfall `oracle_cards` and `default_cards` metadata/download client added.
- Provider JSON validation and explicit per-record rejection reports added.
- Oracle-card and printing normalization separated into versioned contracts.
- Immutable dataset manifests, source/normalized SHA-256 hashes, freshness, atomic persistence, and idempotent reimport added.
- Lookup by normalized name, Oracle ID, Scryfall ID, and set/collector number added.
- Kenessos fixtures and deterministic ingestion/catalog tests added.
- Source attribution, refresh policy, command usage, and failure behavior documented.

## Validation evidence

- CP-00 final branch [CI run 6](https://github.com/keldeo0713/commander-agent-v1/actions/runs/32458014249) passed before merge.
- `node scripts/offline-check.mjs` passed locally for CP-01: 32 source files, 20 JSON files, and all 12 package boundaries validated.
- `git diff --check` passed.
- Complete `pnpm check` and a real Scryfall snapshot acceptance run remain pending CI.

## Assumptions

- Scryfall `oracle_cards` is authoritative for rules-level identities and `default_cards` supplies printing-level identities and attributes.
- Scryfall bulk object timestamps plus source and normalized hashes define the immutable dataset version.
- PostgreSQL remains deferred; CP-01 persists portable filesystem artifacts behind project contracts.

## Known limitations

- Current parsing holds each downloaded JSON array in memory; benchmark the real bulk snapshots before marking CP-01 complete.
- Format banned lists, Game Changers, and Commander legality remain CP-02 scope.
- Prices and image fields are printing facts, but purchasing/market behavior remains out of scope.

## Recommended next action

Run the full CI suite, exercise a current real Scryfall snapshot, record import counts/hashes/freshness, and optimize ingestion memory if the acceptance run shows pressure.
