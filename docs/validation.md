# Validation record

12 September 2026. Local independent demo; no hosted deployment tested.

- Existing monorepo checks and all four production builds passed. Inherited lint warnings and the admin bundle-size advisory remain; no lint errors.
- Fresh PostgreSQL test applies all 28 migrations and seed from nothing. Tests cover unavailable products, invalid quantities/options, authoritative pricing, simulated payment idempotence, customer isolation, staff branch restrictions, financial tampering and collection-board transitions.
- HTTP adapter test passes login, relational menus, checkout, payment, staff lifecycle and branch isolation.
- Browser journey passes customer sign-in and checkout, staff accept/prepare/ready/collect, board appearance/removal, and cart-switch cancel/confirm. Screens checked at 390px customer/mobile website, 1280px staff and 1440px admin/board/website.
- Local reset verified: demo orders, carts and reward balances clear while protected logins remain.
- Neutral starter export verifies customer/admin/staff application source is unchanged when identity and catalogue are replaced. Starter has no client photographs, backend credentials, database or git history.

Artifacts are local under artifacts/. Re-run test-browser-journey.mjs with the backend and apps running. It creates a test order and leaves a branch selected in its isolated browser context. Browser checks require installed Chrome.

Content limits: prices are delivery references; Inanam's menu is illustrative; official logo, exact colour specifications, counter prices and branch photography still require confirmation. Founder and origin remain unverified. Email delivery and social sign-in are not connected locally. Local updates poll every 1.5 seconds. The local adapter is not production hosting.

Hosted verification, 12 September 2026: cloud HTTP checkout/branch checks, protected functions, browser collection flow, board deletion and branch cart-switch tests pass. The four previews use the user-provided isolated Supabase project; websites remain locally hosted. See hosted-setup.md for account location and the Auth advisory.

## Supplied image and brand update — 13 September 2026

- Type checks passed across all eight applicable packages; all four production builds passed. Existing Vite large-chunk warnings remain.
- Website home/menu/story/stores and ordering branch/menu checks passed at 390 and 1440 px via the computer LAN address, without overflow or page errors. This does not confirm access from a physical phone.
- Cloud Storage upload/public retrieval/replacement passed; customer/staff writes and non-image upload were rejected. Temporary test objects were removed.
- Supabase security advisor reports only the existing [leaked-password protection setting](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection); no new storage advisory.
- Four new Sandakan records have accepting_pickup=false; existing products and original branch records were preserved.

## Homepage reference redesign — 13 September 2026

Website type check passed. Browser checks passed at 390, 1440 and 1920 px: all six homepage images decoded, no page errors or horizontal overflow, mobile navigation opened and followed Menu successfully. Homepage footer contrast corrected and browser verified rgb(22,22,22).

Production build passed with PAK_KOPI_BUILD_CHECK=1, which uses ignored `.next-check/` to avoid a Windows file lock in existing `.next/`. Default preview/build directory remains `.next/`.

A read-only design review approved the requested reference direction after the footer contrast correction. This checks homepage fidelity to the supplied reference, not pixel identity, and does not constitute physical-phone network verification. Other app surfaces were not redesigned.

## 14 September 2026 checks

Website and ordering builds passed. Simulated browser journey passed customer checkout, staff preparation/ready/collection, collection-board removal and cart branch-switch cancellation/confirmation. Test creates one simulated order, no real charge. Website and ordering browser checks passed at 390/1440 px. Hero bottom measured exactly at viewport height on 320x568, 390x844, 820x1180 and 1440x900. Signed-in member home and rewards rendered successfully. Wait-time text contrast corrected after visual inspection. Physical Safari phone access was not independently verified.

Smooth-scroll verification: normal 700px wheel gesture sampled at 100ms intervals progressed 345, 504, 582, 635, 661, 679, 688, 693, 696, 698px, confirming a slowing glide. Reduced-motion samples were immediately 700px throughout. Menu anchor and route-navigation checks passed with no browser errors.

14 September About/mobile/color checks: enhanced background and centred text verified at phone/tablet/desktop widths; homepage image treatment scoped to max-width 760px. Ordering member and stamp card rendered with brown filled stamps and oat background. Website/order production builds passed; no ordering logic changed.

Page transitions: 420ms eased opacity entrance through Next template, shared header remains interactive. Reduced motion disables the entrance. Responsive About/header regression checks passed at 390/820/1440/1920px.

