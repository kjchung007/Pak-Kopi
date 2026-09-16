# Architecture

Starter baseline 0.1.0. Four applications provide five surfaces: Next website, React customer app, React admin and React staff/board. Shared typed identity lives in @coffee/brand; business data remains in the database. Original direct dependency versions were retained.

The local preview uses PGlite PostgreSQL with the same migration history, authoritative RPC pricing and row-level policies. Its HTTP adapter accepts a limited Supabase-compatible interface, generates random-password local accounts and polls every 1.5 seconds. Hosted Supabase uses its own Auth and Realtime. Do not deploy the local adapter publicly.

The recovered historical foundation supplies tables that were absent from the old migration history. Historical migration fixes correct a store active column, voucher index order and function-name extraction. Empty-database tests now apply the entire chain. The latest migration validates demo carts, branch availability and simulated payment, restricts financial writes and uses brand-prefixed order numbers. Private demo settings must be explicitly seeded.

No client sends authoritative prices. create_pickup_order calculates them in PostgreSQL; complete_demo_payment checks ownership, availability and immutable totals. Repeated completion is idempotent. Staff writes are restricted to their branch and legal order transitions. Public boards show only queued collection information.

Client projects and databases are separate. This is not a shared multi-brand subscription service. The local migration runner bootstraps a fresh database; later migration changes require deliberate application or recreation of the isolated local database.
