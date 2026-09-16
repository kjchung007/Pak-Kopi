# Import into Vercel

Import the same GitHub repository separately for each app. Enable **Include source files outside of the Root Directory in the Build Step**, because apps share packages/brand. Use Node.js 22.x and pnpm (the root packageManager pins its version). Build command: `pnpm build`. Keep the detected install command, or use `pnpm install --frozen-lockfile`.

| Project | Root directory | Framework | Output |
| --- | --- | --- | --- |
| Public website | apps/web | Next.js | Default |
| Ordering | apps/order | Vite | dist |
| Admin | apps/admin | Vite | dist |
| Staff and waiting board | apps/staff | Vite | dist |

The draft preview shares the website deployment through a protected path. Do not enable WEBSITE_DRAFT_PREVIEW on the public website. The waiting board is part of the staff app, not a separate source project.

## Current Pak Kopi deployment

Website: https://pakkopi.vercel.app
Ordering: https://pak-kopi-order.vercel.app
Admin: https://pak-kopi-admin.vercel.app
Staff: https://pak-kopi-staff.vercel.app

The hosted draft preview now uses the website at `/preview`; a fifth Vercel project is no longer needed. Keep WEBSITE_DRAFT_PREVIEW unset on the public website. Admin automatically chooses the hosted path in production and local port 3001 during development. The public site ignores the preview cookie outside `/preview`. A valid expiring admin-generated link is still required. If overriding VITE_WEBSITE_PREVIEW_URL, use https://pakkopi.vercel.app/preview.

## Environment variables

All apps use the existing Pak Kopi Supabase project. Copy values from your local configuration into Vercel, never into GitHub.

Website and draft preview:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
- NEXT_PUBLIC_SITE_URL = this project's HTTPS URL
- NEXT_PUBLIC_ORDER_APP_URL = ordering app HTTPS URL
- NEXT_PUBLIC_ADMIN_URL = admin HTTPS origin (needed for instant editor preview)
- WEBSITE_DRAFT_PREVIEW = true **only on the draft preview project**

Order, admin and staff:
- VITE_SUPABASE_URL
- VITE_SUPABASE_PUBLISHABLE_KEY
- VITE_LOCAL_DEMO = false (or leave unset)

Ordering also needs VITE_WEBSITE_URL. Admin also needs VITE_WEBSITE_URL and VITE_WEBSITE_PREVIEW_URL. Use origins without a trailing slash for the admin and preview links.

Do not set PAK_KOPI_BUILD_CHECK in Vercel. Do not put Supabase secret/service-role keys, HitPay API keys or webhook salt in frontend environment variables. HitPay secrets remain in Supabase Edge Function secrets.

## After the first deployment

The four project URLs are now configured in packages/brand/brand.json. We will configure cross-app navigation, brand URLs, auth return URLs and allowed redirects, the admin-to-draft preview connection, and HitPay sandbox return-origin restrictions, then redeploy and test. Until these are configured, some links can still point to localhost. Keep HitPay in sandbox.

Test Google sign-in return, sandbox payment return, uploaded images, pickup branch selection, staff queue, waiting board, and draft save/preview/publish isolation. Unsaved draft edits travel only to the embedded preview; external preview links display saved drafts.

Sources: https://vercel.com/docs/monorepos and https://vercel.com/docs/frameworks/frontend/vite
