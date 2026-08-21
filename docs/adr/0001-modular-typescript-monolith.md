# ADR-0001: Begin with a modular TypeScript monolith

- Status: Accepted
- Date: 2026-08-20
- Owners: Product owner and implementation lead
- Checkpoint: CP-00

## Context

The system needs clear boundaries among card data, knowledge, legality, deck specifications, simulation, optimization, reporting, AI providers, and Archidekt. It does not yet have production traffic or benchmark data justifying independently deployed services.

## Decision

Use a pnpm TypeScript monorepo and deployable modular monolith. Packages expose versioned contracts. Simulation and long jobs are accessed through ports that can later be moved to dedicated workers without changing domain meanings.

## Consequences

### Positive

- Fast iteration and straightforward local development.
- One language across the first vertical slice.
- Explicit extraction path for compute-intensive modules.

### Negative

- Process-level isolation and independent scaling are deferred.
- Package boundaries require automated enforcement to avoid erosion.

## Alternatives considered

- Microservices immediately: rejected because operational cost would precede evidence of need.
- Python-first simulation service: deferred until profiling shows TypeScript is insufficient.

## Validation

Boundary checks run in CI. Future service extraction requires measured pressure and must preserve versioned contracts and run-manifest semantics.
