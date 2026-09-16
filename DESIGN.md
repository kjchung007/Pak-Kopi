# Design scope

## Overview

The subsequent explicit homepage replacement request on 13 September 2026 supersedes the rollback below for the website homepage only. Its approved reference is Kenangan Coffee Malaysia: a spacious, white-dominant coffee website with black text and restrained light coffee-brown accents. The implementation and surface direction are recorded in docs/home-reference-direction.md. The rollback remains binding for the ordering app and other website pages; staff/admin are outside this redesign.

## Colors

Homepage colours are scoped in apps/web/src/app/home.css: white backgrounds, near-black text and buttons (#161616), muted body text (#595653), coffee accents (#80634f), and pale section backgrounds (#f4f1ed). Homepage footer branding and links explicitly use near-black. These local colours do not replace the shared customer palette or staff/admin colours.

## Typography

The homepage retains locally served DM Sans through the existing body font variable. Headings use regular weight with slightly tight tracking; the desktop hero scales from 42px to 68px, section headings from 30px to 48px, and body text is 17px (15px on mobile).

## Layout

The homepage uses a wide photographic opening, centred text sections, paired brewing photographs, a bounded drink image, branch links and a pickup action. The white header is 108px on desktop and 82px on mobile. At 760px and below, hero text stacks above the drink image and branch cards become a single column. Preserve breathing room and unclipped cups; the detailed composition belongs to the homepage surface brief, not other screens.

## Elevation & Depth

Homepage sections and chrome are flat, with tonal backgrounds and a fine footer divider. Branch photographs have a subtle hover zoom; reduced-motion settings suppress that effect and button transitions. There is no automatic carousel.

## Shapes

Homepage photographs and section blocks are rectangular. Primary buttons use a small 3px corner radius, near-black fill and white text, changing to coffee brown on hover. Text links use a fine coffee-coloured underline; keyboard focus is visibly outlined.

## Components

Homepage header and footer styling is enabled by pathname-scoped classes in SiteChrome.tsx. Other routes retain their existing chrome. Navigation, menu, story, stores and pickup actions retain existing routes and behaviour.

The opening uses the new homeBannerImage configuration, falling back to heroImage. User-supplied HeroImage4 and HeroImage5 remain the brewing images, and secondaryHeroImage remains the drink selection image. The generated hero is identified as an illustrative concept in alt text and a page-foot note; do not describe it as a verified product photograph or import Kenangan assets or factual claims.

## Do's and Don'ts

Do preserve the supplied Pakopi logo, existing functionality and route-specific design boundaries. Do keep the homepage reference direction limited to the homepage. Don't propagate its palette, typography or layout into ordering, staff/admin or other website pages without an explicit request. Earlier homepage/chrome snapshots are retained in artifacts/home-before-kenangan/; the separate design-preview prototype remains historical.

The prior decisions below remain applicable outside the homepage replacement:

The user reverted the customer redesign on 13 September 2026. Preserve the original Kopi Papa-derived layouts, cards, sections, spacing and interactions across the other website pages and ordering app. Do not simplify, remove, reorder or redesign them without a new explicit request.

Keep the approved customer colours (coffee brown, cream and yellow), supplied Pakopi logo and matching Phosphor icons. Customer colours live in packages/brand/brand.json under customerColors; brand:sync generates the theme. The two classic.css files now contain identity-only adjustments, not layout overrides. Staff/admin retain their existing palette.

Menu, about, stores, customer welcome, campaign placeholder, product descriptions, category sidebar and last-order section remain restored. Locally served fonts remain.

Preserve branch selection, authentication, modifiers, rewards, cart-change confirmation, server validation and simulated payments. No invented brand history. The neutral starter is unchanged by this rollback.

Header colour trial: cream background with dark coffee text/icons on website and ordering headers, including the website mobile menu. Brown remains on the website pickup button. No layout, size, card or section changes.

Header decision outside the homepage: revert the cream-header trial. Other website pages retain the solid deep-brown header with no bottom border or translucent blending. Ordering header retains its previous brown. Their original layouts remain unchanged.

## Public website extension — 13 September 2026

User approved the homepage direction and explicitly requested it across the other public website pages. Shared header/footer now use white and black everywhere; Menu, About and Stores use the same sans-serif type and light coffee accents. This supersedes the old public-page layout/color freeze; ordering, admin and staff remain separate.

All public page opening heroes fill `100svh - --website-header-height` (108px desktop/tablet, 82px narrow mobile). Menu uses an intentionally oversized bottom-cropped drink, a light coffee curved bottom edge and an accessible scroll-to-menu link. The white isolated image backdrop blends with the white page; it is not an alpha-transparent export.

Image settings in brand.json: `websiteLineupImage` for restored drink-and-bean arrangement, `menuHeroImage` for isolated oversized cup. The original user files and previous settings are retained. Website-specific edits live in website.css; home.css is the shared starting visual system.

## 14 September 2026 — lighter ordering app and Menu refinement

Ordering app now uses white headers, near-white panels, black primary actions, muted coffee details and DM Sans headings. Changes are visual only; existing layout, card sizes, feature set and ordering logic remain intact. Identity overrides live in apps/order/src/classic.css; public website and admin/staff colors remain independently scoped.

Website Menu: removed the text action "Browse the drinks". Kept the accessible down-arrow link. Replaced the SVG border with a small CSS curve fixed to the hero floor, preventing a black unstyled SVG strip. Desktop drink is reduced to expose its printed logo. Existing full-screen hero sizing retained.

Latest adjustment, 14 September: mobile Menu curve and its overlapping arrow are hidden; mobile cup sizing is unchanged. Desktop cup height is 138% of its image region, increased from 118%, keeping the printed logo visible. Ordering welcome uses a honey-oat #ead8bb background, dark text and no PK pseudo-element; the home canvas is #faf8f3. Other layouts and functionality unchanged.

## Smooth website scrolling — 14 September 2026

Public website uses Lenis 1.3.26 in SmoothScroll.tsx. Wheel/trackpad input eases toward the target with lerp 0.085; no scroll snapping. Touch keeps native momentum (syncTouch false). Reduced-motion preference is respected. Anchor links use Lenis with native scroll-margin/scroll-padding support; CSS smooth scrolling is disabled only while Lenis is active to prevent competing animations. Instances are destroyed and recreated on pathname changes so wheel inertia cannot carry between pages. Ordering/admin/staff scrolling remains unchanged.

Reference requested: Gong cha. Its public page was inspected, but no exact library/settings identification was established; this implementation recreates the requested slowdown, not a claim of identical source code. Lenis API reference: https://github.com/darkroomengineering/lenis . Automated behavior check: scripts/check-smooth-scroll.mjs.

14 September imagery update: About uses enhanced user-supplied miniature coffee-truck scene via brand.aboutHeroImage, cover crop and dark overlay with centered text. Mobile home hero uses a 1.4 scale and 20% left translation to center the drink group; desktop styles unchanged. Ordering primary/deep actions now #694733/#513725 and filled stamp tiles use coffee brown instead of legacy blue.



Logo fidelity correction: About hero now derives directly from original images/About Pak kopi hero.webp using Lanczos resampling and mild unsharp masking via scripts/prepare-original-about.mjs. No generative redrawing. Generated about-hero-enhanced.png is no longer referenced. Desktop About header (1024px+) is transparent and absolute over a 100svh image; all other routes and mobile/tablet headers remain white. Preserve original cup artwork; do not regenerate logos to invent sharpness.
