# Pakopi pitch demo

A separate client project containing the brand website, customer pickup app, administrator, staff POS and waiting board. No real purchases. Original client files are untouched.

## Current connection

The preview now uses your hosted Supabase project. Start the apps with `node scripts/start-apps.mjs`; use the fresh accounts in `.demo/cloud-accounts.json`. See [hosted setup](docs/hosted-setup.md). The offline setup below remains available as a separate option.

## Offline setup

Requires Node 22+ and Corepack/pnpm 10.15.1. From this folder:

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm brand:sync
corepack pnpm seed:generate
corepack pnpm demo:configure
corepack pnpm demo:server
```

Leave that terminal running. In another terminal run `node scripts/start-apps.mjs`. The first database start creates five random-password accounts in `.demo/accounts.json`. Use these accounts, or register a new demo customer. Restarting the backend signs users out; sign in again. No email or social-login provider is connected locally.

| Surface | Local preview |
| --- | --- |
| Website | http://localhost:3000 |
| Customer | http://localhost:5173 |
| Admin | http://localhost:5174 |
| Staff POS | http://localhost:5175 |
| Sadong waiting board | http://localhost:5175/board/1 |
| Damai waiting board | http://localhost:5175/board/2 |
| Inanam waiting board | http://localhost:5175/board/3 |

The backend binds to this computer only. The waiting board exposes only public collection information for its URL's branch. Staff and administration require protected accounts. The owner can manage all branches; staff accounts are bound to one branch.

## Demo journey

1. Open customer app. Choose Sadong Jaya, then Menu. Add Kopi Ping Kaw and choose its options. Sign in using the customer account.
2. Open cart, proceed to checkout and complete the labelled simulated payment. No bank/card account is used.
3. Sign in to staff using the Sadong account. Move the order through preparation and ready. Open board/1 to see its collection number. Damai's staff/board must not show it.
4. Collect the order in staff. It leaves the public board and appears completed in the customer's history.
5. Add a drink, then change branch. Confirm clearing the cart before switching. Inanam has an explicitly illustrative five-item selection.
6. Sign in as owner to inspect all orders and change product availability. Unavailable products and invalid options are rejected by the backend.

Stop the backend, then run `corepack pnpm demo:reset` to clear demo orders, carts and reward balances and reapply the catalogue. Logins are retained. Reset is restricted to the enabled local demo database.

## Content and branding

Edit `packages/brand/brand.json` for identity, colours, type, URLs and content notes. Edit `packages/brand/catalog.json` for stores, products and branch membership; run brand:sync and seed:generate. The content register documents reference prices, sources, dates and unresolved assets. Platform prices are not confirmed counter prices. Founder and origin remain unverified.

Read [content register](docs/content-register.md), [onboarding](docs/onboarding.md), [architecture](docs/architecture.md) and [validation](docs/validation.md).

## Checks and starter

`corepack pnpm check` runs existing lint, types, tests and production builds. `corepack pnpm test:database` applies every migration and seed to a fresh PostgreSQL engine and checks permissions and the order journey. With the backend running, `node scripts/test-http.mjs` checks the HTTP adapter. Browser scripts require installed Chrome.

`corepack pnpm starter:export` creates a neutral project under `starter/coffee-shop-starter`, excluding credentials, database, orders, research media, artifacts and git history. See docs/onboarding.md for versioned updates.

## Hosted preview

This delivery provides a local pitch preview. The user-provided hosted Supabase project is connected. No public website deployment has been created. A separate hosted database and application hosting must be selected/configured before sharing externally. Apply these migrations and seed only to an empty isolated demo project. Never connect the demo to operational data. Real gateway functions are disabled. The local HTTP adapter is presentation infrastructure, not a production authentication service.

