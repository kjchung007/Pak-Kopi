# Website drafts

Open Admin → Website Editor. The initial draft is a snapshot of the current website, rendered by the same pages and styles on port 3001.

1. Choose Home, Menu, About or Stores.
2. Edit text, replace images, or add/remove website branch listings.
3. Select **Save draft**. The embedded preview updates to the saved draft; the live website stays unchanged.
4. Use Desktop, Tablet or Mobile to check the layout. **Open saved draft** opens a separate window.
5. Copy the preview link to another device on the same Wi-Fi. If it contains localhost, replace only localhost with your computer's Wi-Fi address (currently 192.168.0.148). Keep port 3001 and the entire token. The computer and preview server must remain running; its firewall must permit access.
6. Only **Publish saved draft** changes the live website. Publishing applies the entire saved website draft. Previous published versions can be restored to the draft, reviewed and published again.

Preview links expire after one hour. Renew them in **Versions and preview access**, or revoke all links there. Anyone holding a valid link can view the saved draft until expiry or revocation. Draft content is protected, but uploaded images use public storage URLs; do not upload confidential images.

Adding a website branch listing does not create an operational pickup store or change staff, product menus, orders or availability. New listings have pickup disabled. Website content is a snapshot; reset the draft from live when needed. Unsaved editor changes are not shown in the preview.

Start the preview alone with `corepack pnpm dev:website-preview`, or start the suite with `corepack pnpm demo:apps` (includes port 3001). Deployment needs a separate preview instance with WEBSITE_DRAFT_PREVIEW=true; the live instance must leave it unset. VITE_WEBSITE_URL and VITE_WEBSITE_PREVIEW_URL can override editor links.

Verification: type checks and website/admin production builds passed. Database tests cover publication, restoration and revocation. A cloud test confirmed draft changes do not affect live content or operational stores, denied customer access and stale saves, and checked protected preview access. Test draft edits were restored; no live content was published during implementation. Physical phone access still needs a check on the user's Wi-Fi.

## Instant editor preview
Text, image and branch changes now appear immediately in the embedded preview before saving. They remain in browser memory. Save draft persists them and updates the separate-device preview; publishing is still a separate action. The public website does not listen for editing messages. Hosted preview instances can set NEXT_PUBLIC_ADMIN_URL to the exact trusted admin origin (local default: same hostname, port 5174).

Hosted setup: the production editor uses https://pakkopi.vercel.app/preview with expiring access links. No separate preview deployment is needed. Keep WEBSITE_DRAFT_PREVIEW unset on Vercel. Port 3001 remains for local development only.
