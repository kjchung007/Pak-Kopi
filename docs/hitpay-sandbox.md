# HitPay sandbox integration

Implemented and checked 15 September 2026. This release cannot use a production HitPay API endpoint.

## Configuration

Supabase project: iskgonautyyuygpktexv. Keep HITPAY_API_KEY, HITPAY_SALT and HITPAY_API_URL in Edge Function secrets. API URL must equal https://api.sandbox.hit-pay.com; production values are rejected. No secrets belong in VITE_* variables.

Frontend: packages/brand/brand.json paymentMode=hitpay_sandbox. VITE_LOCAL_DEMO=true retains the isolated simulator. Cloud: private.demo_settings.payment_mode=hitpay_sandbox. Server disables complete_demo_payment in this mode, including its historical private entry point.

Allowed ordering origins default to http://localhost:5173, http://127.0.0.1:5173 and http://192.168.0.148:5173. Set HITPAY_ALLOWED_ORIGINS to a comma-separated explicit list when IP/hosting changes. Do not add arbitrary origins or wildcard hosts. Return URL is derived server-side as /?payment=return&order_id=ID.

## Dashboard step still required

In the SANDBOX dashboard, use Developers → Webhook Endpoints (some layouts expose Webhooks under Settings → API Keys). Create an additional endpoint:

- Name: Pak Kopi Demo
- URL: https://iskgonautyyuygpktexv.supabase.co/functions/v1/hitpay-webhook
- Events: payment_request.completed and payment_request.failed

Keep Kopi Papa's existing webhook. The shared account sends events for other projects; this handler ignores unrelated request IDs. Its hosted name currently appears as ForFun. Do not change shared merchant branding without considering other demos.

## Behaviour and safeguards

- Authenticated create/reconcile functions validate the user using auth.getUser. Gateway JWT checks are off for compatibility with publishable keys, but application authentication is mandatory.
- MYR amounts come from the saved validated order, not client input. Only sandbox card checkout is requested.
- An order-row lock and private unique attempt record serialize checkout creation. Repeated calls reuse the stored checkout. An ambiguous provider timeout or save failure deliberately blocks creating another request for that order; review the attempt and HitPay request logs before manual recovery. No automatic timeout-based duplicate creation.
- Checkout URLs must be HTTPS on a sandbox HitPay host.
- Signed JSON webhooks use HMAC-SHA256 over the exact raw body, then independently retrieve the request from the sandbox API.
- Reconciliation also retrieves the request from HitPay. Browser status query parameters never determine payment state.
- Settlement checks request ID, unique reference, exact cents, MYR and order total. Paid orders cannot be downgraded by late failure notifications. Cancelled orders are not reopened; late successes are flagged needs_review.
- This is a sandbox integration, not a completed production payment/refund system. Zero-total orders are rejected; a dedicated validated free-order flow remains future work.

## Verification

- PASS: real sandbox checkout creation in MYR with saved secrets.
- PASS: repeated request reuses payment request ID; unpaid API reconciliation remains pending.
- PASS: anonymous checkout, unapproved redirect, simulator bypass and forged webhook rejected.
- PASS: published decline test card 4000 0000 0000 0002 shows a decline; published success card 4242 4242 4242 4242 completes the same checkout and redirects back. Only fake test card data used.
- PASS: backend GET reconciliation confirms paid; repeated reconciliation returns paid without duplicate transition.
- PASS: isolated migration/SQL scenarios cover wrong amount, wrong reference, wrong currency, owner mismatch, concurrency guard, production URL rejection, failure-to-success, repeated/out-of-order notifications and authenticated settlement denial.
- Pending: authentic webhook delivery after the user registers the endpoint; webhook_at in private.hitpay_attempts records successful verified delivery.
- Not claimed: physical iPhone return flow, real payments/refunds, or shared account rebranding.

Test order 8 was paid in sandbox and retained for staff workflow inspection. scripts/test-hitpay-sandbox.mjs creates a new test order each run; scripts/check-hitpay-result.mjs checks the last recorded result without paying it. Do not run test-browser-journey.mjs --cloud unchanged: it targets the older internal simulator.

Sources: https://docs.hitpayapp.com/apis/guide/online-payments and https://docs.hitpayapp.com/apis/guide/sandbox.
