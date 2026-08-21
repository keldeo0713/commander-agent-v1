# ADR-0002: Version every measurable run

- Status: Accepted
- Date: 2026-08-20
- Owners: Product owner and implementation lead
- Checkpoint: CP-00

## Context

Deck probabilities can change because of card data, format rules, classifications, goals, simulator behavior, policies, scenarios, seeds, or code. A number without those inputs cannot be reproduced or compared safely.

## Decision

Every simulation and optimization result must reference a validated, immutable `run-manifest/1` document containing the deck/spec identities, component versions, sample count, seed set, and code revision.

## Consequences

### Positive

- Results can be reproduced, compared, audited, and regression-tested.
- Future agents cannot silently compare incompatible runs.

### Negative

- Storage and schema migration overhead.
- More metadata is required before a result can be published.

## Alternatives considered

- Log only engine version and deck list: rejected because data, policy, scenario, and seed differences materially affect results.

## Validation

The schema, sample manifest, and validation command run in CI. Later checkpoints extend manifests only through explicit schema versions.
