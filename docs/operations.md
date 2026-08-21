# Interaction models and operations

CP-10 adds versioned interaction scenarios whose fingerprints include commander removal, board wipes, stack interaction, and opponent count.

Durable execution is defined through a compare-and-set store port. Idempotent acceptance, expiring leases, retries, ownership-checked completion, and failure release ensure an accepted job remains recoverable when a worker disappears. Storage technology remains an adapter choice.

Operational summaries derive completion rate, p95 duration, throughput, and estimated cost per million simulations from observed benchmark samples. No guessed service target is presented as measured evidence.
