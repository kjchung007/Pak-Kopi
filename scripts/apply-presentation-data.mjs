import fs from 'node:fs';
const brand=JSON.parse(fs.readFileSync('packages/brand/brand.json')),catalog=JSON.parse(fs.readFileSync('packages/brand/catalog.json'));
const account=JSON.parse(fs.readFileSync('.demo/accounts.json')).find(a=>a.role==='global_admin');
const base='http://127.0.0.1:54321';
const login=await fetch(base+'/auth/v1/token?grant_type=password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:account.email,password:account.password})});if(!login.ok)throw Error('Local administrator sign-in failed');const {access_token}=await login.json();
async function patch(table,filter,data){const r=await fetch(`${base}/rest/v1/${table}?${filter}`,{method:'PATCH',headers:{'Content-Type':'application/json',Authorization:'Bearer '+access_token},body:JSON.stringify(data)});if(!r.ok)throw Error(table+': '+await r.text());}
await patch('shop_settings','id=eq.true',{shop_name:brand.name,logo_url:brand.logo});
for(const p of catalog.products)await patch('products',`id=eq.${p.id}`,{image_url:p.image});
for(const s of catalog.stores)await patch('stores',`id=eq.${s.id}`,{image_url:s.image});
await patch('campaigns','id=eq.1',{title:brand.tagline,body:brand.description,image_url:brand.heroImage});
const pages=await fetch(base+'/rest/v1/website_pages?select=id,draft_content&published_content=is.null',{headers:{Authorization:'Bearer '+access_token}});if(!pages.ok)throw Error('Cannot read website drafts');
for(const page of await pages.json()){const draft=JSON.stringify(page.draft_content).replaceAll('Pakopi 1969','Pakopi').replaceAll('/brand/pakopi-promo.jpg',brand.heroImage);await patch('website_pages',`id=eq.${page.id}`,{draft_content:JSON.parse(draft)});}
console.log('Updated local presentation data; orders, users and prices retained.');
