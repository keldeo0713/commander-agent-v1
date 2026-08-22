# ADR-0003: Make the optimized template the primary product output

- Status: Accepted
- Date: 2026-08-21
- Owners: Product owner and implementation lead
- Checkpoint: CP-11

## Context

Product review showed that presenting a complete deck first removes too much player expression. The approved experience starts with a commander and bracket, helps the player brainstorm mechanics, and solves the role and quantity mathematics before offering card-level output.

## Decision

The primary flow is commander → bracket (1–5) → curated mechanic discovery → optimized 100-slot functional template. Players may add free-form mechanic ideas, but those ideas must map to registered gameplay components before they influence optimization. A complete legal deck remains an optional example of the template in action. Kenessos is demonstration and regression data only.

The application uses a text-first terminal presentation with persistent back, restart, and keyboard navigation. Import-safe example exports contain only `quantity card-name` lines; UI comments and section labels are never included in the downloaded text.

## Consequences

### Positive

- Players retain card-level authorship while receiving a mathematically coherent base.
- Free-form ideas stay explainable and bounded by the deterministic engine.
- Templates and example decks cannot silently disagree about role quantities.

### Negative

- Card-level optimization becomes a secondary action and needs an explicit template-to-deck trace.
- Curated mechanic coverage and custom-input mapping require ongoing taxonomy work.

## Alternatives considered

- Generate a complete deck immediately: rejected as the primary flow because it over-automates player expression.
- Accept arbitrary strategy text directly in the optimizer: rejected because it makes behavior difficult to validate and reproduce.

## Validation

- The UI flow and state tests require commander and bracket before mechanic selection.
- Every custom mechanic selection records a registered component mapping.
- Template quantities checksum to exactly 100.
- Example exports round-trip as plain importer-safe card lines without comments.
