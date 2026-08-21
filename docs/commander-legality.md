# Commander legality

CP-02 validates deck construction deterministically against an explicit
`commander-rules/1` snapshot. The validator has no AI or network calls. Callers
provide a deck plus card facts from a selected card-data snapshot and receive a
versioned result containing stable violation codes, affected Oracle IDs, and
structured details.

The initial snapshot is effective 2026-02-09 and cites the official Commander
rules, Wizards banned-and-restricted list, and the February 2026 Commander
announcement. It freezes the named banned list and Lutri's companion-only ban;
card-data legality also rejects category bans and cards not legal in Commander.

Supported construction exceptions are basic-land quantities, explicit card
copy limits, Partner, Friends forever, Choose a Background, and Doctor's
companion. Other unusual commander constructions must fail visibly until a
versioned rules snapshot adds support.

Kenessos appears only in legality fixtures proving generic color-identity,
singleton, banned-card, and size behavior. No validator branch refers to
Kenessos or any deck strategy.

Sources:

- [Commander rules](https://mtgcommander.net/index.php/rules/)
- [Wizards banned and restricted list](https://magic.wizards.com/en/banned-restricted-list)
- [February 9, 2026 Commander announcement](https://magic.wizards.com/en/news/announcements/commander-banned-and-restricted-february-9-2026)
