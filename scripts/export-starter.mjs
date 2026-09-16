import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const root=process.cwd(),destination=path.resolve('starter/coffee-shop-starter');
if(!destination.startsWith(path.join(root,'starter')+path.sep))throw Error('Invalid export path');
if(fs.existsSync(destination))throw Error('Starter already exists. Move the previous export before creating a new version.');
const excluded=new Set(['node_modules','.pnpm-store','.git','.demo','.next','.turbo','.temp','dist','artifacts','research','starter','.supabase','.codex','.agents']);
const scriptAllow=new Set(['sync-brand.mjs','seed-catalog.mjs','configure-local.mjs','demo-db.mjs','demo-server.mjs','reset-demo.mjs','start-apps.mjs','test-database.mjs','test-http.mjs','export-starter.mjs','browser-check.mjs','test-browser-journey.mjs']);
function copy(source,target){
 fs.mkdirSync(target,{recursive:true});
 for(const entry of fs.readdirSync(source,{withFileTypes:true})){
  if(excluded.has(entry.name)||entry.name.startsWith('.env')&&entry.name!=='.env.example'||/\.(log|tsbuildinfo|jpg|jpeg|png|webp)$/i.test(entry.name))continue;
  if(source===path.join(root,'scripts')&&!scriptAllow.has(entry.name))continue;
  if(entry.isDirectory())copy(path.join(source,entry.name),path.join(target,entry.name));
  else if(entry.isFile())fs.copyFileSync(path.join(source,entry.name),path.join(target,entry.name));
 }
}
copy(root,destination);
const brand=JSON.parse(fs.readFileSync(path.join(destination,'packages/brand/brand.json')));
Object.assign(brand,{logo:'/brand/logo.svg',icon:'/brand/icon.svg',productPlaceholder:'/brand/product-placeholder.svg',storePlaceholder:'/brand/store-placeholder.svg',showDemoBanner:true,photoNote:'Illustrative sample content.',headline:{lead:'A cup,',accent:'at your pace.'},id:'your-coffee',name:'Your Coffee',shortName:'Your Coffee',initials:'YC',tagline:'A cup, at your pace.',description:'A neutral coffee-shop pickup demonstration.',heroImage:'/brand/product-placeholder.svg',heroImageAlt:'Neutral sample drink placeholder',menuShortNote:'Illustrative sample menu.',menuNote:'All menus and prices are illustrative sample data.',locationNote:'Three fictional branches. Replace their addresses and operating hours before launch.'});
brand.colors={...brand.colors,primary:'#23473c',deep:'#142c25',accent:'#e6bd82',accentInk:'#785128',cream:'#f7f3eb',canvas:'#eeeee7'};
fs.writeFileSync(path.join(destination,'packages/brand/brand.json'),JSON.stringify(brand,null,2)+'\n');
const catalog=JSON.parse(fs.readFileSync(path.join(destination,'packages/brand/catalog.json')));
catalog.verifiedAt=null;catalog.notes='All content is illustrative. Replace and verify before real operations.';catalog.stores.forEach((s,i)=>Object.assign(s,{name:['Central','Riverside','Garden'][i],image:'/brand/store-placeholder.svg',address:'Fictional sample address '+(i+1),source:'Illustrative sample data'}));
catalog.products.forEach((p,i)=>{p.name='Sample drink '+(i+1);p.description='Illustrative sample item. Replace with approved client content.';p.image='/brand/product-placeholder.svg';delete p.imageSource;});
fs.writeFileSync(path.join(destination,'packages/brand/catalog.json'),JSON.stringify(catalog,null,2)+'\n');
for(const file of ['sync-brand.mjs','seed-catalog.mjs']){const r=spawnSync(process.execPath,['scripts/'+file],{cwd:destination,stdio:'inherit',windowsHide:true});if(r.status)throw Error('Starter generation failed');}
fs.writeFileSync(path.join(destination,'docs/content-register.md'),'# Sample content\n\nAll names, addresses, products, prices and images are illustrative. Record client sources and verification dates here. No client assets or verified business claims are included.\n');
fs.writeFileSync(path.join(destination,'docs/validation.md'),'# Validate each client\n\nRun pnpm check, test:database, and the HTTP/browser journey scripts against an isolated backend. Check each branch menu, staff isolation, board updates and cart clearing. Repeat phone, tablet and desktop checks after brand replacement. Hosted auth, official assets and live operations require separate validation.\n');
fs.writeFileSync(path.join(destination,'README.md'),'# Your Coffee starter 0.1.0\n\nSeparate client projects and databases. Edit packages/brand/brand.json and catalog.json, then run brand:sync and seed:generate.\n\nInstall with `corepack pnpm install --frozen-lockfile`. Run `corepack pnpm demo:configure`, then `corepack pnpm demo:server`. In another terminal run `corepack pnpm demo:apps`. Accounts are generated in .demo/accounts.json. Local ports: website 3000, customer 5173, admin 5174, staff 5175 and boards /board/1 to /board/3.\n\nRun `corepack pnpm check` and `corepack pnpm test:database`. Stop the backend before `corepack pnpm demo:reset`. All payments are simulated; the local adapter must not be publicly deployed. See docs/onboarding.md for new-client setup and versioned fixes.\n');
for(const file of ['PRODUCT.md','DESIGN.md'])fs.writeFileSync(path.join(destination,file),'# Neutral coffee-shop starter\n\nPreserve application behaviour and layout. Configure client identity through @coffee/brand and business data through the catalogue/database. All supplied data is illustrative. English, MYR, Malaysia time.\n');
// Ordering behaviour must remain byte-for-byte identical in a second brand.
for(const app of ['order','admin','staff'])if(!fs.readFileSync(path.join(root,`apps/${app}/src/App.tsx`)).equals(fs.readFileSync(path.join(destination,`apps/${app}/src/App.tsx`))))throw Error('Ordering code changed during export');
console.log('Exported neutral starter 0.1.0; application behaviour unchanged:',destination);
