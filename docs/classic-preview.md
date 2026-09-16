# Pakopi classic preview — awaiting approval

Preview: http://localhost:3000/design-preview/index.html

Scope: standalone visual prototype in apps/web/public/design-preview. The existing website, ordering application, shared brand settings and backend are unchanged. Homepage, menu, ordering, customisation sheet, branch change and basket review are included. No order or payment requests are made.

## Approved direction for exploration

User selected coffee brown, cream and small yellow accents on 12 September 2026. Classic, authentic everyday coffee shop; avoid premium treatment. This selection governs the preview, not approval to replace the current applications.

- Brown #563726 for controls and display text; ink #35251d for reading.
- Cream #fff8e9 and paper #fffdf6 as the main surfaces; milk #f1e6d2 for pickup context.
- Yellow #efd064 as a small supporting accent. The supplied Pakopi logo stays intact.
- Bree Serif for sturdy, familiar sign-like headings; DM Sans for menus and controls. Locally served Google Fonts files, downloaded 12 September 2026. Existing project font families retained; size, composition and colour treatment changed.
- Rounded 8px controls and photography. A single broad arch on the homepage photograph gives a softer storefront feel. No metallic gradients, oversized black panels or ornate luxury styling.
- Website: welcoming introduction, menu and pickup locations. Ordering: selected branch, searchable drinks, clear reference prices, basket. Mobile order review stays within easy reach at the bottom.

## Evidence and limits

The existing charcoal/gold menu devotes most of the first desktop viewport to a promotional hero. The proposed menu shows products much sooner. The existing logo and catalog are reused; no founder, origin date, bestseller or opening-hours claims were introduced. Photos remain temporary illustrative assets from the existing content register. Branch menus and reference prices are copied from packages/brand/catalog.json. Inanam remains illustrative. Customisations and cart interactions run in browser memory only.

Apple HIG references applied as web principles, not native Apple UI conventions: branding.md / Best practices (content first), buttons.md / Best practices (44px hit areas), color.md and accessibility.md (contrast and non-colour feedback), lists-and-tables.md (scannable content). UI/UX Pro Max's cafe palette result supports warm brown/cream; generic green/pink system output was rejected as a poor match. The user's explicit classic palette overrides the Impeccable concept roll. Taste dials: variance 4, motion 2, density 5. No current DESIGN.md replacement until approval.

## Next step after approval

Apply the approved identity and layout to the real website and ordering components, retaining authenticated cart, branch availability, server validation and simulated payment flow. This preview does not constitute that implementation.

## Applied 13 September 2026
The approved direction is now applied to the real website and ordering app, with shorter mobile copy, horizontal mobile categories, visible prices, Phosphor navigation icons and additional logo placements. Customer colours are configured in packages/brand/brand.json (customerColors); brand:sync regenerates the shared customer theme. Staff/admin remain unchanged.

Validation: both production builds and type checks pass; lint exits successfully with image optimisation and existing React warnings. Browser checks passed at 390, 768 and 1440 pixels with no overflow or page errors. Full hosted simulated customer checkout, staff preparation/ready/collection, waiting-board removal and branch-switch cancellation/confirmation passed. Vite reports a 513.69 kB main bundle warning; code splitting remains future work. Photography remains illustrative.


## Layout rollback — 13 September 2026
User rejected the applied layout. Original sections, cards, copy and ordering layout restored. Only customer colours, icons, logo and local fonts retained. The prototype is a historical reference, not an approved implementation. See docs/network-preview.md for phone access fixes.

