import fs from 'node:fs';
const url='http://127.0.0.1:54321';
for(const app of ['web','order','admin','staff'])fs.writeFileSync(`apps/${app}/.env.local`,`VITE_SUPABASE_URL=${url}\nVITE_SUPABASE_PUBLISHABLE_KEY=local-demo-public\nVITE_LOCAL_DEMO=true\nNEXT_PUBLIC_SUPABASE_URL=${url}\nNEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=local-demo-public\nNEXT_PUBLIC_ORDER_APP_URL=http://localhost:5173\nVITE_WEBSITE_URL=http://localhost:3000\n`);
console.log('Configured local demo endpoints only. No cloud credentials required.');
