# Delivery checkpoints

The detailed objectives and exit criteria live in `docs/HLD.md`. This file is the execution ledger.

| Checkpoint | Name | Status | Evidence |
|---|---|---|---|
| CP-00 | Foundation and governance | COMPLETE | [Merged PR #1](https://github.com/keldeo0713/commander-agent-v1/pull/1), [CI run 6](https://github.com/keldeo0713/commander-agent-v1/actions/runs/32458014249) |
| CP-01 | Versioned card truth | COMPLETE | [Merged PR #2](https://github.com/keldeo0713/commander-agent-v1/pull/2), [live acceptance run 19](https://github.com/keldeo0713/commander-agent-v1/actions/runs/32462509574) |
| CP-02 | Commander legality engine | COMPLETE | [Merged pull request #3](https://github.com/keldeo0713/commander-agent-v1/pull/3), [CI run 24](https://github.com/keldeo0713/commander-agent-v1/actions/runs/32464046735) |
| CP-03 | Structured deck specification | COMPLETE | [Merged PR #4](https://github.com/keldeo0713/commander-agent-v1/pull/4), [CI run 30](https://github.com/keldeo0713/commander-agent-v1/actions/runs/32464891525) |
| CP-04 | Functional knowledge and candidate retrieval | COMPLETE | [Merged PR #5](https://github.com/keldeo0713/commander-agent-v1/pull/5), [CI run 37](https://github.com/keldeo0713/commander-agent-v1/actions/runs/32466184536) |
| CP-05 | Kenessos setup and commander-removal simulator | COMPLETE | [Merged PR #6](https://github.com/keldeo0713/commander-agent-v1/pull/6), [CI run 46](https://github.com/keldeo0713/commander-agent-v1/actions/runs/32466707384) |
| CP-06 | Baseline builder and optimizer | COMPLETE | [Merged PR #7](https://github.com/keldeo0713/commander-agent-v1/pull/7), [CI run 54](https://github.com/keldeo0713/commander-agent-v1/actions/runs/32496071932) |
| CP-07 | End-to-end AI adviser | COMPLETE | [Merged PR #8](https://github.com/keldeo0713/commander-agent-v1/pull/8), [CI run 58](https://github.com/keldeo0713/commander-agent-v1/actions/runs/32496390649) |
| CP-08 | User application and Archidekt export | READY_FOR_REVIEW | [PR #9](https://github.com/keldeo0713/commander-agent-v1/pull/9), [CI run 60](https://github.com/keldeo0713/commander-agent-v1/actions/runs/32496638561) |
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
- [x] A current selected Scryfall snapshot imports fully or every rejected record is reported (38,626 Oracle identities, 116,619 printings, 81 explicit issues).
- [x] Reimport is idempotent in deterministic fixtures and in live acceptance.
- [x] Kenessos resolves to one Oracle identity with the expected reference facts.
- [x] Source attribution and refresh policy are documented.
- [x] Full `pnpm check` and CP-01 CI pass ([run 19](https://github.com/keldeo0713/commander-agent-v1/actions/runs/32462509574)).

## CP-02 exit checklist

- [x] Generic commander eligibility, color-identity, size, singleton, banned-list, and structured violation validation exist.
- [x] Versioned format snapshot cites official sources and captures the current named banned list plus Lutri's companion exception.
- [x] Supported basic-land, card copy-limit, Partner, Friends forever, Background, and Doctor's companion exceptions exist.
- [x] Invalid Kenessos off-color, duplicate, banned, and size fixtures exist without Kenessos-specific validator code.
- [x] The commander-rules package contains no LLM or network calls.
- [x] Supported legality fixture suite and full CI pass 100% ([run 23](https://github.com/keldeo0713/commander-agent-v1/actions/runs/32463914254): 18/18 tests).

## CP-03 exit checklist

- [x] Versioned DeckSpec separates hard constraints, guardrails, objectives, preferences, scenarios, and continuation requirements.
- [x] Provider-independent AI draft compiler exposes visible defaults, inferences, clarification, and unsupported-goal results.
- [x] Registered executable goal validation prevents invented probability metrics.
- [x] Approved Kenessos reference request and defaults are represented in a golden fixture.
- [x] Hard constraints and preferences cannot be silently interchanged by the schema.
- [x] Full fixture suite and CI pass ([run 28](https://github.com/keldeo0713/commander-agent-v1/actions/runs/32464801676): 23/23 tests).

## CP-04 exit checklist

- [x] Versioned role taxonomy and provenance model exist.
- [x] Generic deterministic eligibility classifier supports the Kenessos criteria as request data.
- [x] Lexical and pluggable semantic retrieval return visible reasons and legality.
- [x] Multi-role cards retain all deterministic roles.
- [x] Frozen benchmark target is established at 100% recall and passes.
- [x] Full CI passes ([run 36](https://github.com/keldeo0713/commander-agent-v1/actions/runs/32466103238)).

## CP-05 exit checklist

- [x] Versioned zone, turn, mana, mulligan, action-policy, commander-tax, removal-profile, and PRNG contracts exist.
- [x] Required top-deck setup, activation, eligible-payoff, removal, and recast primitives exist.
- [x] Success events, intervals, histograms, and exhaustive failure reasons are reported.
- [x] Exact probability-zero/one fixtures and deterministic replay checks pass.
- [x] Matched seeded goldfish/removal reports make assumptions and outcome changes visible.
- [x] Unsupported mechanics remain visible in report identity.
- [x] Full CI passes ([run 43](https://github.com/keldeo0713/commander-agent-v1/actions/runs/32466585881)).

## CP-06 exit checklist

- [x] Deterministic baseline builder honors deck size, locks, exclusions, role floors, Game Changers, and continuation paths.
- [x] Constraint failures are structured and never silently relaxed.
- [x] Swap evaluation uses paired search seeds and records compute cost.
- [x] Pareto filtering preserves primary, removal, continuation, interaction, and theme tradeoffs.
- [x] Qualifying finalists receive fresh holdout-seed evaluation.
- [x] No-improvement outcomes remain explicit.
- [x] Full CI passes ([run 51](https://github.com/keldeo0713/commander-agent-v1/actions/runs/32495954441)).

## CP-07 exit checklist

- [x] Request-to-spec-to-retrieval-to-build-to-evaluation orchestration exists.
- [x] Clarification, unsupported, and structured build failures stop safely.
- [x] Explanations accept only retrieved facts or run evidence.
- [x] Lock, exclude, relax, and rerun create immutable child deck versions.
- [x] Deck-version comparison reports metric deltas.
- [x] Reference flow is executable entirely through ports without editing internal data.
- [x] Full CI passes ([run 56](https://github.com/keldeo0713/commander-agent-v1/actions/runs/32496271032)).

## CP-08 exit checklist

- [x] Responsive shell covers chat, spec, deck, results, and comparison.
- [x] Job progress, stale-event protection, and cancellation exist.
- [x] Basic deck-list import reports malformed lines.
- [x] Account-free Archidekt-compatible export validates before emitting.
- [x] Export round-trip preserves all 100 cards and commander identity by name/section.
- [x] No undocumented authenticated Archidekt dependency exists.
- [x] Full CI passes ([run 60](https://github.com/keldeo0713/commander-agent-v1/actions/runs/32496638561)).
