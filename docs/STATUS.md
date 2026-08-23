# Project status

| Field | Value |
|---|---|
| Active checkpoint | CP-26 — Complete player-deck validation |
| Status | READY_FOR_REVIEW |
| Last updated | 2026-08-23 |
| HLD version | 1.1 |
| Next checkpoint | Complete-list terminal workflow |

## Current objective

Validate a player-built list as a complete 100-card deck only when every functional role and land slot is exactly covered and named nonbasic identities remain singleton-safe.

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
- CP-02 merged through pull request #3 with every exit criterion satisfied.
- Versioned `deck-spec/1` separates hard constraints, guardrails, objectives, preferences, continuation paths, and scenario assumptions.
- Provider-independent AI draft-generator port, registered-goal enforcement, structured clarification/unsupported results, and visible inference reasons added.
- Approved Kenessos golden request added as a reference fixture rather than a schema specialization.

- CP-03 merged through pull request #4 with every exit criterion satisfied.
- Versioned role evidence, generic eligibility classification, hybrid retrieval, and frozen recall benchmark added.
- Kenessos remains benchmark data only; production retrieval is commander-agnostic.

- CP-04 merged through pull request #5 with every exit criterion satisfied.
- Versioned deterministic simulator, seeded PRNG, zones, mulligan, mana, commander tax/removal/recast, top-deck setup, activation, reporting, and visible coverage gaps added.

- CP-05 merged through pull request #6 with every exit criterion satisfied.
- Deterministic baseline construction, structured constraint failures, paired-seed swaps, Pareto filtering, holdout reevaluation, and compute accounting added.

- CP-06 merged through pull request #7 with every exit criterion satisfied.
- End-to-end adviser orchestration, explicit stop states, evidence validation, immutable deck versions, revision operations, and comparison added.

- CP-07 merged through pull request #8 with every exit criterion satisfied.
- Responsive workspace shell/state, cancellation, stale-event protection, and validated portable import/export added.

- CP-08 merged through pull request #9 with every exit criterion satisfied.
- Six-archetype regression registry, versioned goals, required primitive declarations, and visible unsupported behavior added.

- CP-09 merged through pull request #10 with every exit criterion satisfied.
- Versioned interaction fingerprints, durable-store job leases/retries, and benchmark-derived operational targets added.
- CP-11 records the approved template-first flow in HLD 1.1 and ADR-0003.
- Commander + bracket now lead into mechanic discovery, including bounded custom-input mapping.
- The terminal workspace produces an exact 100-slot functional template as its primary result.
- Complete decks are optional examples; their downloads contain only importer-safe quantity/name lines.
- CP-11 merged through pull request #12 after final CI run 82.
- CP-12 adds a generic template orchestrator for commander resolution, explainable mechanic retrieval, bounded custom mapping, exact template allocation, and role-matched example validation.
- CP-12 merged through pull request #13 after final CI run 86.
- CP-13 adds a dependency-free localhost server, health endpoint, demo self-check, and current setup instructions.
- CP-14 adds local JSON endpoints for session discovery, custom mechanic mapping, exact template optimization, and optional example construction.
- The terminal browser now renders API results instead of owning mechanic, template, or card-list mathematics.
- The Kenessos example is role-aligned to the exact 100-slot template and exported as plain quantity/name lines.
- CP-15 adds exact-name Scryfall commander resolution with legality and commander-eligibility gates, request caching, and normalized source facts.
- Oracle text, type line, color identity, and provenance now reach the terminal and deterministically rank commander-linked mechanic options.
- Provider tests use injected responses; Kenessos remains the offline self-check fixture rather than a production-only code path.
- CP-16 adds versioned bracket baselines, registered-mechanic deltas, bounded role floors/ceilings, deterministic balancing, and visible allocation reasons.
- Different strategy selections and brackets now produce materially different exact-100 templates without changing the 37-land foundation before card-level curve analysis exists.
- The Kenessos example fixture dynamically follows the allocated role quantities and remains exactly 100 cards.
- CP-17 adds rate-limited, cached Scryfall role searches and a versioned candidate-bundle contract.
- Provider results are independently filtered for Commander legality, commander color identity, Oracle-ID uniqueness, and commander exclusion.
- The terminal exposes candidate inspection as a secondary action with required quantities and per-card retrieval evidence; no card is silently selected.
- CP-17 merged through pull request #18 after final CI run 106.
- CP-18 adds a versioned mechanic-aware query planner for engine and payoff roles while retaining generic support-role plans.
- Query identity is invariant to mechanic order and commander identity; it contains no Kenessos or other commander-name specialization.
- Six frozen archetypes now prove differentiated top-deck, graveyard, spells, tokens, artifacts, and combat retrieval intent.
- Candidate groups expose the query-plan ID and reason before showing legal in-color cards.
- CP-18 merged through pull request #19 after final CI run 110.
- CP-19 adds a versioned ranking contract with explicit role-text, selected-mechanic, and role-specific mana-value contributions.
- Ranking is invariant to provider order, selected-mechanic order, and duplicate mechanic IDs, with deterministic name and Oracle-ID tie-breaks.
- The terminal shows rank, score, every score contribution, and ranking version while leaving all card choices to the player.
- CP-19 merged through pull request #20 after final CI run 114.
- CP-20 adds a versioned candidate-selection state with mutually exclusive per-role include/exclude decisions.
- Exact selected, required, excluded, and remaining quantities are derived from the functional template, with over-selection rejected.
- Available decisions persist across candidate refreshes while stale provider results are pruned safely.
- Terminal controls visibly distinguish included and excluded cards and state that no slot is auto-filled.
- CP-20 merged through pull request #21 after final CI run 118.
- CP-21 expands default candidate pools to at least 12 cards or the role requirement, capped at 25.
- Retrieval caches retain the full ranked provider result so a smaller earlier template cannot truncate later role coverage.
- The same Oracle identity cannot be included in two roles, preserving Commander singleton semantics before export.
- Partial selection export contains only `quantity card-name` lines, includes the commander, and omits comments or section headers.
- CP-21 merged through pull request #22 after final CI run 122.
- CP-22 adds a versioned color-identity-aware mana-base plan for colorless through five-color commanders.
- Safe basic lands receive exact quantities while fixing and utility lands remain visible functional slots instead of invented card choices.
- Every mana plan checksums to the template's authoritative 37-land quantity and records its current pip-demand assumptions.
- Full coverage separately reports structural allocation, named cards, remaining nonlands, and unresolved mana slots.
- Partial selection export now includes the plan's named basics without presenting unnamed nonbasic slots as completed cards.
- CP-22 merged through pull request #23 after final CI run 126.
- CP-23 carries normalized mana costs on candidate cards and counts selected-card colored symbols by commander identity.
- Basic quantities rebalance proportionally while preserving at least one basic for every commander color and the exact 37-land checksum.
- A cached Scryfall adapter retrieves legal, nonbasic, in-identity lands with explicit fixing or utility evidence.
- The terminal refreshes pip demand after every include/exclude choice and displays named nonbasic options as unselected suggestions.
- CP-23 merged through pull request #24 after final CI run 129.
- CP-24 adds a versioned player-owned nonbasic selection state with deterministic singleton identity.
- Fixing and utility choices cannot exceed their respective planned slot capacities.
- Named colored sources count basic quantities plus selected lands for every demanded commander color.
- Source results visibly distinguish not-demanded, present, and missing while refusing to claim cast-on-curve sufficiency.
- Selected nonbasics contribute to named-card coverage and importer-safe partial export; unselected suggestions do not.

## Validation evidence

- CP-00 final branch [CI run 6](https://github.com/keldeo0713/commander-agent-v1/actions/runs/32458014249) passed before merge.
- `node scripts/offline-check.mjs` passed locally for CP-01: 32 source files, 20 JSON files, and all 12 package boundaries validated.
- `git diff --check` passed.
- CP-01 [CI run 19](https://github.com/keldeo0713/commander-agent-v1/actions/runs/32462509574) passed the complete `pnpm check` chain and imported the same current Scryfall snapshot twice with identical IDs and hashes.
- Acceptance dataset `scryfall-20260820210532-75809e87b469` contained 38,626 Oracle identities and 116,619 printings. All 81 rejected default-card records were retained as explicit `invalid_record` issues.
- The normalized SHA-256 was `75809e87b46990767407ec4666979e75d36ab98d3881c01f12447ab8100e8aeb`; source hashes were `af0e7fe0657d5075d79ad1c97af820d6dfea7be0470e7d940cc17dbdd9a0bdb5` for 38,626 Oracle records and `60bafbc94807edc33e29346eff7103a25f698bbbb1809cf296bc090dd0727301` for 116,700 default-card records.
- Provider freshness at acceptance was approximately 11.2 hours.
- CP-02 [CI run 23](https://github.com/keldeo0713/commander-agent-v1/actions/runs/32463914254) passed lint, strict typecheck, all 18 tests across 6 files, all 12 package boundaries, and manifest validation.
- CP-03 [CI run 30](https://github.com/keldeo0713/commander-agent-v1/actions/runs/32464891525) passed before merge.
- CP-04 [CI run 36](https://github.com/keldeo0713/commander-agent-v1/actions/runs/32466103238) passed the complete check chain and the frozen benchmark achieved 100% recall.
- CP-11 [CI run 80](https://github.com/keldeo0713/commander-agent-v1/actions/runs/32551491570) passed lint, strict typecheck, all 53 tests across 17 files, all 12 package boundaries, and manifest validation.
- CP-12 local validation passes lint, strict typecheck, all 57 tests across 18 files, all 12 package boundaries, offline validation, and `git diff --check`.
- CP-12 [CI run 84](https://github.com/keldeo0713/commander-agent-v1/actions/runs/32551782373) passed the complete check chain.
- CP-13 local validation passes lint, strict typecheck, all 58 tests across 19 files, all 12 package boundaries, `pnpm demo:check`, offline validation, and `git diff --check`.
- CP-13 [CI run 88](https://github.com/keldeo0713/commander-agent-v1/actions/runs/32552692904) passed the complete check chain.
- CP-14 local validation passes strict typecheck, lint, all 59 tests across 19 files, the demo API self-check, all 12 package boundaries, and `git diff --check`.
- CP-14 [CI run 92](https://github.com/keldeo0713/commander-agent-v1/actions/runs/32592023953) passed the complete check chain.
- CP-15 local validation passes strict typecheck, lint, all 63 tests across 21 files, the demo API self-check, all 12 package boundaries, and `git diff --check`.
- CP-15 [CI run 96](https://github.com/keldeo0713/commander-agent-v1/actions/runs/32592588783) passed the complete check chain.
- CP-16 local validation passes strict typecheck, lint, all 67 tests across 22 files, the demo API self-check, offline validation, all 12 package boundaries, and `git diff --check`.
- CP-16 [CI run 100](https://github.com/keldeo0713/commander-agent-v1/actions/runs/32609526025) passed the complete check chain.
- CP-17 local validation passes strict typecheck, lint, all 70 tests across 23 files, the complete demo API self-check, all 12 package boundaries, and `git diff --check`.
- CP-17 [CI run 104](https://github.com/keldeo0713/commander-agent-v1/actions/runs/32612598317) passed the complete check chain.
- CP-17 final [CI run 106](https://github.com/keldeo0713/commander-agent-v1/actions/runs/32612675217) passed before merge.
- CP-18 local validation passes strict typecheck, lint, all 73 tests across 24 files, the demo API self-check, offline validation, all 12 package boundaries, and `git diff --check`.
- CP-18 [CI run 108](https://github.com/keldeo0713/commander-agent-v1/actions/runs/32613094438) passed the complete check chain.
- CP-18 final [CI run 110](https://github.com/keldeo0713/commander-agent-v1/actions/runs/32613141022) passed before merge.
- CP-19 local validation passes strict typecheck, lint, all 76 tests across 25 files, the demo API self-check, offline validation, all 12 package boundaries, and `git diff --check`.
- CP-19 [CI run 112](https://github.com/keldeo0713/commander-agent-v1/actions/runs/32614133213) passed the complete check chain.
- CP-19 final [CI run 114](https://github.com/keldeo0713/commander-agent-v1/actions/runs/32614171654) passed before merge.
- CP-20 local validation passes strict typecheck, lint, all 79 tests across 26 files, the demo API self-check, offline validation, all 12 package boundaries, and `git diff --check`.
- CP-20 [CI run 116](https://github.com/keldeo0713/commander-agent-v1/actions/runs/32615061396) passed the complete check chain.
- CP-20 final [CI run 118](https://github.com/keldeo0713/commander-agent-v1/actions/runs/32615114447) passed before merge.
- CP-21 local validation passes strict typecheck, lint, all 81 tests across 26 files, the demo API self-check, offline validation, all 12 package boundaries, and `git diff --check`.
- CP-21 [CI run 120](https://github.com/keldeo0713/commander-agent-v1/actions/runs/32615969447) passed the complete check chain.
- CP-21 final [CI run 122](https://github.com/keldeo0713/commander-agent-v1/actions/runs/32616027895) passed before merge.
- CP-22 local validation passes strict typecheck, lint, all 88 tests across 27 files, the demo API self-check, offline validation, all 12 package boundaries, and `git diff --check`.
- CP-22 [CI run 124](https://github.com/keldeo0713/commander-agent-v1/actions/runs/32621119920) passed the complete check chain.
- CP-22 final [CI run 126](https://github.com/keldeo0713/commander-agent-v1/actions/runs/32621186925) passed before merge.
- CP-23 local validation passes strict typecheck, lint, all 92 tests across 28 files, the demo API self-check, offline validation, all 12 package boundaries, and `git diff --check`.
- CP-23 [CI run 128](https://github.com/keldeo0713/commander-agent-v1/actions/runs/32621715909) passed the complete check chain.
- CP-23 final [CI run 129](https://github.com/keldeo0713/commander-agent-v1/actions/runs/32621759328) passed before merge.
- CP-24 local validation passes strict typecheck, lint, all 95 tests across 29 files, the demo API self-check, offline validation, all 12 package boundaries, and `git diff --check`.
- CP-24 [CI run 131](https://github.com/keldeo0713/commander-agent-v1/actions/runs/32655175448) passed the complete check chain.
- CP-24 final [CI run 133](https://github.com/keldeo0713/commander-agent-v1/actions/runs/32655231947) passed before merge.
- CP-25 local validation passes strict typecheck, lint, all 99 tests across 30 files, JavaScript syntax validation, the demo API self-check, offline validation, all 12 package boundaries, and `git diff --check`.
- CP-25 [CI run 135](https://github.com/keldeo0713/commander-agent-v1/actions/runs/32655959837) passed the complete check chain.
- CP-25 final [CI run 136](https://github.com/keldeo0713/commander-agent-v1/actions/runs/32656046342) passed before merge through pull request #26.
- CP-26 local validation passes strict typecheck, lint, all 102 tests across 31 files, the demo API self-check, offline validation, all 12 package boundaries, and `git diff --check`.
- CP-26 [CI run 138](https://github.com/keldeo0713/commander-agent-v1/actions/runs/32656376185) passed the complete check chain.

## Assumptions

- Scryfall `oracle_cards` is authoritative for rules-level identities and `default_cards` supplies printing-level identities and attributes.
- Scryfall bulk object timestamps plus source and normalized hashes define the immutable dataset version.
- PostgreSQL remains deferred; CP-01 persists portable filesystem artifacts behind project contracts.

## Known limitations

- JSONL records are decoded incrementally after gzip decompression; normalized records remain in memory during snapshot construction. The selected live snapshot completed within the acceptance runner's 6 GiB heap allowance.
- Game Changers and bracket guardrails remain later deck-spec/builder scope; they are not format legality failures.
- Prices and image fields are printing facts, but purchasing/market behavior remains out of scope.
- Arbitrary commander discovery requires access to Scryfall's named-card API. Kenessos remains available offline for deterministic setup and self-checks.
- Mana-base quantity remains fixed at 37 until a card-level candidate pool and mana-curve/source analysis can justify changing it with evidence.
- Mechanic deltas currently operate on functional roles; card-level realization and simulation-backed calibration remain later checkpoints.
- Candidate retrieval uses deterministic Scryfall syntax and a small inspection pool; the frozen calibration proves differentiated retrieval intent, not live precision/recall or card optimality.
- Candidate ranking is a transparent lexical and mana-value heuristic; EDHREC-ordered provider retrieval still bounds the inspected pool, and scores are not simulation-backed optimality claims.
- Candidate pools remain capped at 25 and use only the first Scryfall result page; unusually large or low-recall roles may still need pagination or broader retrieval.
- Pip demand currently covers player-included nonland candidates but not the commander's printed mana cost or unchosen future cards.
- Land-quality ranking uses transparent Oracle-text and price signals; it does not model land-type synergies, price availability, or in-game sequencing.
- Cast-on-curve targets use a 99-card hypergeometric model with an opening seven and one draw per turn. Mulligans, ramp, filtering, treasures, and tapped-source timing remain explicit exclusions.
- Mana-base candidates and complete arbitrary-commander example construction remain deferred.

## Recommended next action

Publish CP-26, verify CI, then connect complete-list validation and export to the terminal workflow without automatic card choices.
