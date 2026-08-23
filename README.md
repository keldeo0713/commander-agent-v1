# Commander Agent

An evidence-driven AI system that helps players choose a commander and bracket, explore mechanics, and generate an optimized 100-card functional template before optionally viewing a complete example deck.

The first vertical slice optimizes a fishing-themed **Kenessos, Priest of Thassa** deck for a mana-value-6-or-greater activation hit by turn 4, while accounting for commander removal and preserving credible ways to win afterward.

## Current status

The approved template-first terminal demo is locally runnable. See [docs/STATUS.md](docs/STATUS.md) and [docs/CHECKPOINTS.md](docs/CHECKPOINTS.md) for implementation evidence and remaining production boundaries.

## Setup

Requirements: Node.js 24+ and pnpm 11+.

```bash
pnpm install && pnpm check
```

That single command installs dependencies, lints, type-checks, tests, verifies architectural boundaries, and validates the sample run manifest.

## Run the local demo

From the repository folder:

```bash
pnpm install
pnpm demo
```

Open `http://127.0.0.1:4173` in a browser. Stop the server with `Ctrl+C`.

The browser calls a local application API for commander resolution, mechanic discovery, bounded custom mapping, exact template allocation, candidate inspection, and optional example construction. Arbitrary commander names are resolved exactly through the [Scryfall named-card API](https://scryfall.com/docs/api/cards/named), must be Commander-legal and commander-eligible, and use current card text and color identity to rank mechanic options. This requires internet access. Bracket and selected mechanics deterministically adjust bounded functional-role quantities; every result remains exactly 100 cards and displays its allocation reasons. `INSPECT_CARD_CANDIDATES` retrieves a small legal, in-color, evidence-backed pool for each nonland role without selecting those cards for the player. Engine and payoff searches are planned from registered mechanic IDs, expose the plan version and reason, and contain no commander-specific branches. Candidates are deterministically ranked by visible role-text, selected-mechanic, and mana-value signals; these inspectable heuristic scores organize options and are not claims of card optimality. Players can explicitly include or exclude inspected cards and see selected, required, and remaining role coverage; these decisions never auto-fill the deck. The mana base remains conservatively fixed at 37 until card-level curve analysis can justify changing it. Kenessos remains the only complete card-level example.

To verify the local demo without keeping a server open:

```bash
pnpm demo:check
```

## Architecture

The approved system design lives in [docs/HLD.md](docs/HLD.md). The repository starts as a modular TypeScript monolith with versioned contracts and replaceable ports for data, simulation, optimization, AI providers, and Archidekt.

## Working model

- `main` stays reviewable and stable.
- Each checkpoint is implemented on a feature branch and reviewed by pull request.
- Architectural changes require an ADR.
- Probability claims require a reproducible run manifest.
- User changes are preserved; agents inspect the worktree before editing.

## Ownership

This repository and all project code belong to its repository owner. Contributions should remain understandable, testable, and portable without a particular AI vendor.
