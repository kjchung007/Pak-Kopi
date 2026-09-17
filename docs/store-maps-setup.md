# Branch links and customer distance

In Admin → Stores, select the branch.

1. In Google Maps, open the branch's **place listing**, choose Share, then Copy link.
2. Paste the link in **Shop link for Directions**.
3. Use **Preview shop link** to confirm that it opens the correct shop.
4. Choose **Get distance location**. Supported Google share links are expanded on the server. Place URLs containing coordinates also fill the location immediately.
5. Confirm the branch name, address, state, phone and hours. The link does not import these details.
6. Save the store. Reopen it to confirm the link is retained.

Website Directions uses the saved shop link, unchanged. Distance uses the separately stored latitude and longitude. The ordering app requests location permission and displays approximate straight-line distances; it cannot show distance when permission is denied or branch coordinates are missing.

If Google does not expose the coordinates in its redirect, open the branch's actual place listing in a desktop browser and paste its full URL. Camera-centre coordinates (`@lat,lng`) alone are deliberately not accepted: these can point beside the shop. An unresolved lookup preserves the existing location and never invents coordinates.

The `/api/resolve-maps` Vercel function belongs to the admin project. The local Vite server provides the same endpoint. It follows only approved HTTPS Google Maps redirects, with bounded redirects and timeouts. No new API key is needed for supported link expansion.

Verification: `node scripts/test-google-maps.mjs`, `node scripts/test-store-discovery.mjs`, and `node scripts/test-store-links-ui.mjs`. The last requires the local admin server and existing `.demo/cloud-accounts.json`; it intercepts writes to avoid changing live stores.
