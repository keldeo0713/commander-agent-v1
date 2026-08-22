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
| CP-08 | User application and Archidekt export | COMPLETE | [Merged PR #9](https://github.com/keldeo0713/commander-agent-v1/pull/9), [CI run 65](https://github.com/keldeo0713/commander-agent-v1/actions/runs/32496813557) |
| CP-09 | Generalization | COMPLETE | [Merged PR #10](https://github.com/keldeo0713/commander-agent-v1/pull/10), [CI run 70](https://github.com/keldeo0713/commander-agent-v1/actions/runs/32497123444) |
| CP-10 | Interaction models and operational scaling | COMPLETE | [Merged PR #11](https://github.com/keldeo0713/commander-agent-v1/pull/11), [CI run 76](https://github.com/keldeo0713/commander-agent-v1/actions/runs/32497531454) |
| CP-11 | Template-first product flow | COMPLETE | [Merged PR #12](https://github.com/keldeo0713/commander-agent-v1/pull/12), [CI run 82](https://github.com/keldeo0713/commander-agent-v1/actions/runs/32551573149) |
| CP-12 | Live template orchestration | COMPLETE | [Merged PR #13](https://github.com/keldeo0713/commander-agent-v1/pull/13), [CI run 86](https://github.com/keldeo0713/commander-agent-v1/actions/runs/32551837922) |
| CP-13 | Runnable local demo | COMPLETE | [Merged PR #14](https://github.com/keldeo0713/commander-agent-v1/pull/14), [CI run 88](https://github.com/keldeo0713/commander-agent-v1/actions/runs/32552692904) |
| CP-14 | Local demo API integration | COMPLETE | [Merged PR #15](https://github.com/keldeo0713/commander-agent-v1/pull/15), [CI run 94](https://github.com/keldeo0713/commander-agent-v1/actions/runs/32592100565) |
| CP-15 | Authoritative commander resolution | IN_PROGRESS | Local validation: 63/63 tests plus demo API self-check |

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

## CP-09 exit checklist

- [x] Regression suite covers six materially different Commander archetypes.
- [x] Goal definitions declare required simulator primitives independently of commanders.
- [x] Coverage gates execute only fully supported goals.
- [x] Partial support reports exact missing primitives visibly.
- [x] Kenessos remains exactly one regression fixture with no schema specialization.
- [x] Full CI passes ([run 67](https://github.com/keldeo0713/commander-agent-v1/actions/runs/32496998621)).

## CP-10 exit checklist

- [x] Interaction assumptions are explicit, versioned, and reproducibly fingerprinted.
- [x] Accepted durable jobs use idempotency, leases, expiry, retries, and ownership-checked completion.
- [x] Worker failure or lease expiry does not lose accepted work when backed by a durable store adapter.
- [x] Completion, p95 latency, throughput, and cost targets derive from benchmark observations.
- [x] Full CI passes ([run 73](https://github.com/keldeo0713/commander-agent-v1/actions/runs/32497417696)).

## CP-11 exit checklist

- [x] Product-review decisions are recorded in HLD 1.1 and ADR-0003.
- [x] Commander and bracket precede mechanic discovery.
- [x] Custom mechanic ideas require a visible registered-component mapping.
- [x] The primary result is an exact 100-slot functional template.
- [x] Complete card lists remain optional examples and Kenessos remains fixture-only.
- [x] Example export contains only importer-safe quantity/name lines.
- [x] Full feature-branch CI passes ([run 80](https://github.com/keldeo0713/commander-agent-v1/actions/runs/32551491570): 53/53 tests).

## CP-12 exit checklist

- [x] Commander names resolve through an injected card-data port.
- [x] Mechanic discovery returns deduplicated reasons and provenance.
- [x] Free-form mechanics cannot proceed without registered component IDs.
- [x] Template optimization rejects any result that does not total exactly 100.
- [x] Optional examples must total 100, include a commander, and match every template role quantity.
- [x] Feature-branch CI passes ([run 84](https://github.com/keldeo0713/commander-agent-v1/actions/runs/32551782373): 57/57 tests).

## CP-13 exit checklist

- [x] `pnpm demo` starts the terminal application on a documented localhost URL.
- [x] The server exposes a health endpoint and serves only allowlisted demo assets.
- [x] `pnpm demo:check` verifies health, terminal HTML, and the interactive browser script.
- [x] Cross-platform setup and shutdown instructions are documented in `README.md`.
- [x] The demo boundary identifies Kenessos as the only card-level fixture while allowing any commander through the template flow.
- [x] Feature-branch CI passes ([run 88](https://github.com/keldeo0713/commander-agent-v1/actions/runs/32552692904): 58/58 tests plus demo self-check).

## CP-14 exit checklist

- [x] Browser discovery calls the local API rather than reading a browser-owned mechanic fixture.
- [x] Custom input must receive a registered component mapping from the application adapter.
- [x] Template generation runs through `TemplateOrchestrator` and rejects a non-100 result.
- [x] Optional Kenessos example construction runs through the orchestrator and matches every template role quantity.
- [x] Example export remains importer-safe quantity/name lines with no comments or section headers.
- [x] API integration tests cover discovery, mapping, template generation, and the exact 100-card example.
- [x] Feature-branch CI passes ([run 92](https://github.com/keldeo0713/commander-agent-v1/actions/runs/32592023953): 59/59 tests plus demo API self-check).

## CP-15 exit checklist

- [x] Non-fixture commander names resolve through an exact authoritative provider lookup.
- [x] Missing, non-Commander-legal, and commander-ineligible cards cannot begin a template session.
- [x] Resolved identity includes Oracle ID, canonical name, color identity, type line, Oracle text, and source provenance.
- [x] Commander card text deterministically ranks registered mechanic candidates and produces visible evidence.
- [x] Provider behavior is cached and covered by injected success, rejection, and not-found tests.
- [x] Kenessos remains a deterministic offline fixture while arbitrary commanders use the generic provider path.
- [ ] Feature-branch CI passes.
