# Commander Agent

An evidence-driven AI system for building legal MTG Commander decks against explicit, turn-based strategic goals.

The first vertical slice optimizes a fishing-themed **Kenessos, Priest of Thassa** deck for a mana-value-6-or-greater activation hit by turn 4, while accounting for commander removal and preserving credible ways to win afterward.

## Current status

CP-00 foundation and governance. See [docs/STATUS.md](docs/STATUS.md) and [docs/CHECKPOINTS.md](docs/CHECKPOINTS.md).

## Setup

Requirements: Node.js 24+ and pnpm 11+.

```bash
pnpm install && pnpm check
```

That single command installs dependencies, lints, type-checks, tests, verifies architectural boundaries, and validates the sample run manifest.

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
