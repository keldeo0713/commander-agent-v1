# Versioned card data

CP-01 uses Scryfall bulk exports as the initial machine-readable card source.
The ingestion command downloads both `oracle_cards` and `default_cards` so
rules-level identities remain separate from printing-level identifiers and
attributes.

## Run an import

Requirements: Node.js 24+, pnpm 11+, and enough disk/memory for both Scryfall
bulk files.

```bash
pnpm ingest:scryfall --output data/card-datasets
```

Each import is written atomically beneath a content-addressed dataset ID. A
completed dataset contains the exact source bytes, normalized Oracle cards,
normalized printings, an explicit rejected-record report, and `manifest.json`.
Reimporting unchanged source content returns the existing immutable dataset.

## Manifest and freshness

`card-dataset/1` records:

- Scryfall bulk object IDs and provider update timestamps.
- Download time, byte count, record count, and SHA-256 for each source.
- SHA-256 for deterministic normalized output.
- Accepted Oracle/printing counts and every rejected record.

Scryfall publishes bulk exports daily. Refresh at most daily for normal use and
display freshness from the newest recorded provider timestamp. Old datasets
remain immutable so builds and later simulations can reference the exact card
truth they used.

## Source and attribution

- [Scryfall bulk-data API](https://scryfall.com/docs/api/bulk-data)
- [Scryfall card object](https://scryfall.com/docs/api/cards)

The client identifies itself with a project-specific user agent, accepts only
HTTPS URLs on Scryfall-controlled hosts, and treats downloaded JSON as untrusted
input. Scryfall provider shapes stay inside `packages/card-data`; downstream
packages consume normalized project contracts instead.

## Failure behavior

A source-level transport or JSON failure aborts the import. Record-level
problems do not disappear: each rejected record receives a source type, source
index, best-known Scryfall ID, reason code, and message. Consumers can therefore
distinguish a complete clean import from a completed import with explicit data
loss.
