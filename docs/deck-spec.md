# Structured deck specification

CP-03 represents player intent as `deck-spec/1`. Hard constraints, guardrails,
optimization objectives, preferences, reporting/scenario assumptions, and
continuation requirements occupy separate fields so an AI compiler cannot
silently exchange their meanings.

The compiler accepts a provider-independent `DeckSpecDraftGenerator`. It gives
the generator only registered goal IDs and visible approved defaults, then runs
deterministic validation. Missing material information returns
`clarification_required`; invented executable metrics return `unsupported`.
Every inferred value carries a JSON-pointer path and user-facing reason.

The first registered goal is
`commander-cheat-eligible-creature-by-turn/1`. Its parameters explicitly carry
the commander identity, eligible creature types, minimum mana value, and turn
deadline. Future strategies extend the registry with tested definitions rather
than commander-specific branches in the compiler.

The Kenessos golden request validates the approved defaults: mana value 6,
turn 4, at most three Game Changers, commander-removal stress, diagnostic
goldfish comparison, and at least one continuation/win path. Kenessos is a
reference fixture, not the DeckSpec schema.
