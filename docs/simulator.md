# Deterministic simulator

CP-05 introduces `simulator/1`, a seeded, reproducible setup simulator. Inputs identify the deck, card dataset, Commander rules snapshot, engine, action/mulligan policy, removal profile, sample count, and seeds.

The engine models a 99-card library plus command-zone commander, London-style mulligans, turn draws, one land play per turn, commander casting and tax, commander removal and recasting, top-two setup, activation mana, and eligible-payoff hits. Reports include matched goldfish/removal estimates, Wilson 95% intervals, success-turn histograms, commander casts/removals, and exhaustive failure reasons.

Unsupported mechanics are explicit report inputs. Current limitations include detailed stack priority, multiplayer politics, arbitrary replacement effects, and full Oracle-text execution. These gaps cannot silently count as simulated behavior.

The reference scenario uses generic role slots and policy parameters. Kenessos is reference input, not simulator control flow. Exact fixtures prove probability 0 and 1 cases, while matched seeded tests prove removal decreases the milestone estimate and identical inputs reproduce identical reports.
