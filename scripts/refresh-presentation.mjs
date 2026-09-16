import fs from 'node:fs';
const assets=[
 ['coffee-cream','https://images.unsplash.com/photo-1625126625143-4e7efb664206','https://unsplash.com/photos/clear-drinking-glass-with-black-liquid-o05n1Ey79fY','Rohan Gupta'],
 ['coffee-glass','https://images.unsplash.com/photo-1645592241237-3b05af6c194f','https://unsplash.com/photos/a-glass-of-iced-coffee-with-a-spoon-in-it-ZWAiv50W3QA','Nicholas Ng'],
 ['coffee-iced','https://images.unsplash.com/photo-1625126590447-cb769384e1f0','https://unsplash.com/id/foto/fotografi-makro-menjatuhkan-es-batu-dalam-cangkir-BIeXZhg_7sw','Kaffee Meister'],
 ['cafe-counter','https://images.unsplash.com/photo-1453614512568-c4024d13c247','https://unsplash.com/s/photos/cafe-shop','Unsplash'],
 ['cafe-interior','https://images.unsplash.com/photo-1604601398877-6247e2f56de0','https://unsplash.com/photos/black-and-gray-chair-beside-white-table-w9Gzk7aPGfY','Unsplash'],
 ['tea-lemon','https://images.unsplash.com/photo-1758705206938-a196ac3ae3bb','https://unsplash.com/photos/glass-of-iced-tea-with-lemon-and-mint-fDWtPLCPgKU','Elena Leya'],
 ['chocolate','https://images.unsplash.com/photo-1562114527-85ec3bb56897','https://unsplash.com/photos/hot-chocolate-on-cup-ASqklsopvdw','Sara Cervera'],
];
await Promise.all(assets.map(async([name,url])=>{const r=await fetch(url+'?auto=format&fit=max&w=1600&q=85&fm=jpg');if(!r.ok)throw Error(name+': '+r.status);const data=Buffer.from(await r.arrayBuffer());for(const app of ['web','order','admin','staff'])fs.writeFileSync(`apps/${app}/public/brand/${name}.jpg`,data);}));
for(const app of ['web','order','admin','staff'])fs.copyFileSync('images/Pakopi_Logo-removebg.png',`apps/${app}/public/brand/pakopi-logo.png`);
const read=p=>JSON.parse(fs.readFileSync(p));const save=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const brand=read('packages/brand/brand.json');Object.assign(brand,{name:'Pakopi',description:'Your favourite kopi, ready for pickup in Sabah.',showDemoBanner:false,logo:'/brand/pakopi-logo.png',icon:'/brand/pakopi-logo.png',productPlaceholder:'/brand/coffee-cream.jpg',storePlaceholder:'/brand/cafe-counter.jpg',heroImage:'/brand/coffee-glass.jpg',heroImageAlt:'Iced coffee — temporary reference photograph',photoNote:'Preview photography is illustrative; drinks and café interiors are not verified Pakopi photographs.'});save('packages/brand/brand.json',brand);
const catalog=read('packages/brand/catalog.json');
for(const p of catalog.products){const type=p.category==='Tea'?'tea-lemon':p.category==='Chocolate'?'chocolate':['coffee-cream','coffee-glass','coffee-iced'][(p.id-1)%3];p.image=`/brand/${type}.jpg`;p.imageSource=assets.find(a=>a[0]===type)[2];p.imageStatus='Temporary stock reference, not the actual product';}
catalog.stores.forEach((s,i)=>{s.image=`/brand/${i===1?'cafe-interior':'cafe-counter'}.jpg`;s.imageStatus='Temporary café reference, not this branch';});save('packages/brand/catalog.json',catalog);
fs.appendFileSync('docs/content-register.md','\n## Presentation refresh — 12 September 2026\n\nUser supplied images/Pakopi_Logo-removebg.png and Pakopi Logo.jpg. The transparent PNG is now used unchanged. The display name is Pakopi; the original logo artwork retains its small Since 1969 line. Global independent-demo banners are hidden by presentation configuration; simulated checkout stays labelled.\n\nTemporary stock photography replaces missing photographs at the user’s request. It does not establish actual products or branch interiors. Files are hosted locally for a reliable preview.\n\n'+assets.map(([name,url,page,author])=>`- ${name}.jpg — ${author}; ${page}; image ${url}; checked 2026-09-12.`).join('\n')+'\n');
console.log('Saved supplied logo, seven stock reference photographs and refreshed presentation data.');
