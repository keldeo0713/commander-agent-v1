# User application and portable export

CP-08 provides a responsive, keyboard-accessible workspace shell for chat, specification, deck, results, comparison, visible assumptions, and job progress. The state model rejects stale job events and exposes cancellation through AbortSignal.

Portable text import/export is local and account-free. Export validates exactly 100 cards, one or two commanders, positive quantities, and unique Oracle identities before emitting an Archidekt-compatible list. The parser accepts common set/collector suffixes and reports malformed lines. Round-trip tests preserve every card name, quantity, and commander.

No authenticated, undocumented, or write-capable Archidekt endpoint is required.
