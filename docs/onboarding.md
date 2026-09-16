# Brand onboarding and starter updates

1. Export starter 0.1.0 and copy it into a separate client repository. Keep the original client intact.
2. Replace packages/brand/brand.json identity, palette, typography, logos, content notes and app URLs. Supply approved logo files after generating placeholders. Run brand:sync only when you intend to regenerate those assets.
3. Replace catalogue stores/products, prices, image references, branch membership and modifier policy. Record sources, verification dates and owner approval. Current demo modifiers are Regular/Large +MYR1, Hot/Iced; changing this policy requires the corresponding database validation change.
4. Run seed:generate. Create a fresh independent database. Never copy .env, .demo, orders, customer records or credentials.
5. Configure environment URLs and authentication. Create protected branch staff and one owner. Demonstrate cross-branch isolation.
6. Run existing checks, fresh-database tests and full browser order journey at phone/tablet/desktop sizes. Recheck brand assets, metadata, receipts and waiting board.
7. Record client version and starter version in STARTER_VERSION. Separate real launch, payment integration and domain/deployment approval from the pitch.

Keep a clean canonical starter repository, tag releases (starting v0.1.0), and record migration and compatibility changes in CHANGELOG.md. Fix shared behaviour there first; apply reviewed commits to each client with cherry-pick or a reviewed patch. Rebase only when the client history permits it. Resolve brand-specific differences deliberately; apply each database migration once and rerun each client's checks. Independent copies do not receive updates automatically.

The included neutral sample is Your Coffee. Its export changes identity and catalogue data while retaining ordering code. Any live payment implementation is a separate project phase.
