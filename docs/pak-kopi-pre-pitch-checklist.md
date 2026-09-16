# Pak Kopi pre-pitch checklist

Checked 14 September 2026. This is a demonstration readiness review, not approval for real trading.

## Credentials and integrations

- Google: button and OAuth call implemented; live Supabase public auth settings report Google disabled. Email enabled, Apple disabled. Google end-to-end login remains untested.
- HitPay: deliberately disabled. Three integration functions return HTTP 410 in source; checkout calls complete_demo_payment. Adding a key alone will not enable live payments.
- Google credentials can technically be reused with correctly registered callback URLs, but separate client projects should use separate Google Cloud projects/OAuth clients and consent branding. Using the same Google account to manage them is fine. Do not change Kopi Papa's consent branding to Pak Kopi.
- Pak Kopi Google callback: https://iskgonautyyuygpktexv.supabase.co/auth/v1/callback. Register the eventual ordering URL and its /?auth=callback redirect in the appropriate Google/Supabase settings.
- HitPay sandbox credentials are for sandbox only. For production, use Pak Kopi's own approved merchant account, settlement details and credentials. A different API key inside the same merchant account does not create separate merchant ownership.
- Keep Pak Kopi's existing separate Supabase project and its keys. Never substitute Kopi Papa's database keys or copy customer data.
- Keep secrets in provider dashboards/server secrets, not browser code or shared pitch documents.

## Verified this review

- [x] Type checks passed across all eight configured package tasks.
- [x] Production builds passed for website, ordering, admin and staff. Bundle-size warnings remain on some apps.
- [x] Unit-test command passed; most app packages contain no unit tests, so this alone is not comprehensive coverage.
- [x] Fresh local database migrations, seed and scenario tests passed: server-authoritative totals, unavailable items, invalid quantity/modifiers, repeated simulated payment, customer ownership, staff branch isolation, price protection and waiting-board lifecycle. These ran in an isolated local database, not against every deployed cloud policy.
- [x] Cloud admin image upload, public image loading and replacement passed; customer/staff uploads and non-image files were denied. Temporary test uploads were removed.
- [x] Cloud admin login and protected-function checks passed, including anonymous admin denial and disabled provisioning.
- [x] Browser demo order: customer email login, simulated checkout, staff prepare/ready/collect, live waiting-board appearance/removal, and cart branch-switch cancel/confirm passed. A test order was created and collected in the demo backend.

## Before sending the pitch

- [ ] Deploy a stable HTTPS preview and configure all website/order/admin/staff links. localhost and 192.168 addresses are not usable by Pak Kopi outside this network.
- [ ] Open the deployed link on an actual iPhone/Safari and Android/Chrome over mobile data; check menus, image loading, checkout, keyboard and navigation.
- [ ] Review all branch names, photos, addresses, hours and pickup availability. Verify each branch's actual products, modifiers and counter prices; Inanam reference content remains illustrative.
- [ ] Approve the logo, written name Pak Kopi, hero concepts, image rights, store photos and factual copy. Generated hero artwork is illustrative and should not be presented as a photograph of a real outlet.
- [ ] Prepare limited demo accounts with separate customer/staff/admin roles. Share credentials privately. Staff/admin previews currently bind to localhost and need protected hosting for remote use.
- [ ] Either configure and test Google login or explain it is not connected during the pitch. Apple login remains a coming-soon action.
- [ ] Keep checkout explicitly simulated and make the demonstration purpose clear in the pitch.
- [ ] Review points, stamps, vouchers, expiry and redemption rules with Pak Kopi. Confirm earn/redeem/reversal behaviour before making business promises.
- [ ] Test editing a product's name, price and availability in admin and confirm customer refresh, using a temporary demo product rather than overwriting curated items.
- [ ] Prepare a short walkthrough: choose branch → choose drink → simulated checkout → staff prepares → ready board → collection.
- [ ] Review the demo reset procedure before use; do not erase uploaded/curated content just to tidy test orders.

## Before real orders (separate release)

- [ ] Obtain Pak Kopi's approval, operational contacts and ownership of production provider accounts.
- [ ] Implement HitPay production integration: server-created amounts, authenticated checkout, verified webhooks, idempotency, reconciliation, cancellation/failure/timeout and refund paths. Never treat a browser redirect alone as payment confirmation.
- [ ] Test HitPay sandbox thoroughly, then an authorized small real payment and refund under Pak Kopi's merchant account.
- [ ] Verify Google consent/redirects on the final HTTPS domain, email verification, password reset delivery, session expiry and account deletion.
- [ ] Agree privacy/terms/refund content and data retention; complete production access review, backup/restore, monitoring and recovery checks.
- [ ] Test real printers, staff devices, pickup workflow, business hours, concurrent orders, stock changes and reward accounting.

References: [Supabase Google setup](https://supabase.com/docs/guides/auth/social-login/auth-google), [HitPay sandbox guide](https://hitpayapp.com/blog/hitpay-sandbox).

Additional results: lint completed with no errors after excluding generated .next-check build output; existing warnings remain. Rewards/member-home browser rendering passed, including the logo-only stamp styling. Physical-device testing, Google login and HitPay payment testing remain unverified.


## Update — 15 September 2026
HitPay sandbox is now connected; the earlier disabled-integration notes are superseded by docs/hitpay-sandbox.md. Hosted MYR test checkout, declined card, successful card, verified return reconciliation, duplicate-request protection and sandbox guards passed. Real payments remain disabled. Authentic webhook delivery remains pending dashboard registration. Ordering typecheck and production build passed (bundle-size warning remains).

