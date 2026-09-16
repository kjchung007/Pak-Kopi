# Homepage and supplied images

The homepage component is `apps/web/src/app/page.tsx` (TSX, not TXS).

To change the main image:
1. Put your image in `apps/web/public/brand/`.
2. Open `packages/brand/brand.json`.
3. Change `heroImage` to `/brand/your-image.png` and update `heroImageAlt`.
4. Change `secondaryHeroImage` for the other two drink-photo sections.
5. Save and refresh the website. Restart the website if the shared config has not refreshed.

Current images: `pak-kopi-hero.png` (three cups) and `pak-kopi-drinks.png` (drink lineup). The source originals remain in `images/`. Copying an image into the source folder alone does not publish it. CSS fitting lives in `apps/web/src/app/classic.css`; existing page structure remains in `page.tsx`.

If you publish a custom homepage in the admin website editor, that published page takes priority over the default TSX homepage.

Branch photos can be replaced through the admin store editor. Four Sandakan branches were added: Bandar Sandakan, Prima Sandakan, Batu 6 Sandakan, Batu 8 Sandakan. Their names/photos use supplied filenames and visible signage; full addresses, hours and menus await confirmation. Pickup is disabled for these branches. The food-truck photo has no confirmed branch identity and has not been assigned to a store.

For a fresh demo, `packages/brand/catalog.json` and the generated `supabase/seed.sql` include these branches with empty menus and pickup disabled. Do not apply the full seed over edited live content. `scripts/sync-supplied-branches.mjs` uploads supplied branch images and adds missing named branches without changing product records; rerunning it intentionally refreshes those four branch photos.

Product uploads use the hosted `public-assets` bucket. Migration `20260913084758_public_assets_storage.sql` creates the public image bucket with a 10 MB limit and restricts writes to authenticated global administrators. `node scripts/test-cloud-storage.mjs` validates upload, replacement, public display and rejected unauthorized/non-image uploads using the private local demo account files.

Latest homepage (Kenangan reference): change `homeBannerImage` in brand.json to replace the new wide opening photograph. `HeroImage4` and `HeroImage5` control the brewing pair; `secondaryHeroImage` controls the drink lineup. New styles live in `apps/web/src/app/home.css` and apply only to the homepage. The ordering app retains its existing theme.

`websiteLineupImage` now controls the sharper homepage drink lineup with restored beans. `menuHeroImage` controls the isolated oversized Menu cup. Both are website-only settings, leaving other app images intact. Their backgrounds are white rather than alpha-transparent.

The first-screen height and Menu bottom curve are in `apps/web/src/app/website.css`. `--website-header-height` sets the offset; the hero height uses `100svh` for stable mobile browser sizing.

About hero now uses about-wide-branded.webp via aboutHeroImage in packages/brand/brand.json. Desktop uses cover for edge-to-edge fill and retains the transparent About-only header. Cup marks use the supplied logo linework; regenerate placements with scripts/brand-about-cups.mjs if needed.

