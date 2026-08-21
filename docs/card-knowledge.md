# Card knowledge and candidate retrieval

CP-04 introduces the versioned `card-knowledge/1` evidence model. Retrieval combines deterministic Oracle-text role rules, parameterized creature eligibility, lexical matching, and an optional semantic adapter. Every candidate retains retrieval reasons, its supplied legality result, all detected roles, confidence, rule/model identity, and dataset provenance.

The production classifier is commander-agnostic. The Kenessos benchmark passes `{ minimumManaValue: 6, creatureTypes: [Kraken, Leviathan, Octopus, Serpent] }` as ordinary request data. No Kenessos name or Oracle ID appears in classifier or retrieval control flow.

## Benchmark contract

The curated CP-04 fixture covers top-deck setup, multi-role classification, eligible large creatures, and an intentionally illegal retrieval. The initial target is 100% recall on this small frozen regression set. Precision is not a gate because CP-04 optimizes for high recall; later builder stages rank and filter the explainable pool.

Semantic retrieval is a port, not a provider dependency. Adapters return a model ID, score, and human-readable reason. Deterministic rules remain usable offline and semantic evidence never replaces legality.
