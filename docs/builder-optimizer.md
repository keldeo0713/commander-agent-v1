# Baseline builder and optimizer

CP-06 adds deterministic baseline construction and a provider-independent evaluation loop. The builder satisfies locked cards, exclusions, role minimums, Commander deck size, Game Changer limits, and declared continuation paths. It returns structured failures instead of silently relaxing requirements.

The optimizer evaluates swaps using shared search seeds, filters illegal or guardrail-collapsing decks, retains a Pareto frontier across setup, removal resilience, continuation, interaction, and theme, then reevaluates qualifying finalists on fresh holdout seeds. Search history and total sample cost remain visible.

A no-improvement result is valid and explicit. A higher early-turn estimate is rejected when it drops below approved continuation or interaction floors. Kenessos is an evaluation input, not builder or optimizer control flow.
