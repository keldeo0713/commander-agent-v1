# Generalization suite

CP-09 freezes six materially different regression archetypes: top-deck cheat, graveyard recursion, spellslinger, go-wide tokens, artifact combo, and Voltron. Each goal declares its required simulator primitives independently of a commander name.

Coverage assessment permits execution only when all required primitives are implemented. Partial coverage returns a visible unsupported result and the exact missing primitives. Kenessos appears in one regression fixture; goal schemas and coverage logic contain no commander specialization.
