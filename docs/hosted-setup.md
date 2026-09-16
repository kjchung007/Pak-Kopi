# Hosted demo setup

Connected 12 September 2026 to the user-provided Pakopi project, iskgonautyyuygpktexv, in Seoul. This project was empty before setup.

- The initial cloud migration `coffee_suite_initial` bundles the original 28 migration files in their existing order. It does not copy old client records or credentials. Cloud migration history consequently has a bundled baseline, not the 28 historical timestamps; do not blindly push the old files again. Apply subsequent migrations deliberately after this baseline.
- The three demo branches, catalogue, availability and website drafts are seeded. Payments use complete_demo_payment; no payment gateway is connected.
- Five newly generated, email-confirmed demo accounts are stored locally in .demo/cloud-accounts.json. Passwords differ from the offline demo. The setup used the Auth admin API without sending emails. The one-time provisioner is now a disabled endpoint returning 410.
- create-staff-account, admin-control and delete-my-account require JWT verification and validate the signed-in user and database role. They use server-side credentials supplied by Supabase, never browser secret keys.
- The four app .env.local files use the hosted project and its publishable key. The website and app servers still run locally; this is not a public website deployment.

Start the previews with `node scripts/start-apps.mjs`. No local database server is required in cloud mode. To return to cloud settings later, run `node scripts/use-cloud.mjs`. `demo:configure` switches back to the separate offline database. The offline reset script does not reset Supabase.

Run `node scripts/test-http.mjs --cloud`, `node scripts/test-cloud-access.mjs`, and `node scripts/test-browser-journey.mjs --cloud` with the previews running. The tests create synthetic orders. Use only the generated demo accounts for these tests.

Production email delivery, social sign-in, domain hosting and real payments remain separate configuration work. Use the Supabase dashboard to invite/create real team accounts when moving beyond this demonstration.

The security advisor reported no database findings after baseline installation. HTTP checks verified authoritative pricing, payment idempotence/validation, branch isolation and protected status updates. Protected-function checks verified anonymous rejection and disabled bootstrap access.

The follow-up waiting_board_delete_events migration sets replica identity full on the public collection-board table. This preserves branch information in deletion events; the hosted browser journey now verifies collected orders disappear without a refresh. Fresh-database checks pass all 29 migrations.

A subsequent security-advisor check reported one Auth setting: leaked-password protection is disabled. Review https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection before accepting operational accounts. Demo passwords are newly generated random values.
