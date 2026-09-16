# Pickup branch cards

Pickup opens a photo-card carousel immediately and requests browser location automatically. Permission and a secure context are still required. Coordinates stay in component memory and are not sent to the database. Denied, unavailable, insecure and pending permission all retain browsing.

With coordinates, Near me filters mapped stores within 30 km. Search overrides this filter across all available branches. Missing branch coordinates never generate a distance. When no available stores are mapped, cards remain visible. State filters and twelve-card batches keep larger lists manageable. Paused and inactive branches are excluded (inactive at the existing query).

Admin Stores now saves photo, state, city and optional paired latitude/longitude. Existing addresses supplied the initial Sabah/KK/Sandakan classifications. No branch coordinates were invented. Current active branch photos are labelled placeholders until replaced. Equal opening/closing times retain the existing all-day demo semantics.

Validation: scripts/test-store-discovery.mjs covers nearby radius, missing coordinates, paused branches, state filters and nationwide search. Cloud columns and region values verified. Physical mobile permission/HTTPS still requires testing on a secure deployment.
