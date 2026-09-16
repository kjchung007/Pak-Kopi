import fs from 'node:fs';
const {url,publishableKey}=JSON.parse(fs.readFileSync('.demo/cloud-connection.json'));
for(const app of ['web','order','admin','staff'])fs.writeFileSync(`apps/${app}/.env.local`,`VITE_SUPABASE_URL=${url}\nVITE_SUPABASE_PUBLISHABLE_KEY=${publishableKey}\nVITE_LOCAL_DEMO=false\nNEXT_PUBLIC_SUPABASE_URL=${url}\nNEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${publishableKey}\nNEXT_PUBLIC_ORDER_APP_URL=http://localhost:5173\nVITE_WEBSITE_URL=http://localhost:3000\n`);
console.log('Configured the four apps to use the hosted demo project.');
