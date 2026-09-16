import fs from 'node:fs';
const brand=JSON.parse(fs.readFileSync('packages/brand/brand.json'));
const catalog=JSON.parse(fs.readFileSync('packages/brand/catalog.json'));
const q=v=>"'"+String(v).replaceAll("'","''")+"'";
const categories=[...new Set(catalog.products.map(p=>p.category))];
let sql=`-- Demo content only. Reapply using the reset script on this isolated project.\nupdate private.demo_settings set enabled=true,order_prefix=${q(brand.initials)} where id;\n`;
sql+=`insert into public.shop_settings(id,shop_name,logo_url) values(true,${q(brand.name)},${q(brand.logo)}) on conflict(id) do update set shop_name=excluded.shop_name,logo_url=excluded.logo_url;\n`;
for(const s of catalog.stores)sql+=`insert into public.stores(id,name,address,opening_time,closing_time,image_url,accepting_pickup) values(${s.id},${q(s.name)},${q(s.address)},'00:00','00:00',${q(s.image||brand.storePlaceholder)},${s.acceptingPickup!==false}) on conflict(id) do update set name=excluded.name,address=excluded.address,image_url=excluded.image_url,accepting_pickup=excluded.accepting_pickup;\n`;
categories.forEach((c,i)=>sql+=`insert into public.categories(id,name,display_order) values(${i+1},${q(c)},${i}) on conflict(id) do update set name=excluded.name;\n`);
for(const p of catalog.products)sql+=`insert into public.products(id,category_id,name,description,price_cents,image_url,sort_order) values(${p.id},${categories.indexOf(p.category)+1},${q(p.name)},${q(p.description)},${p.priceCents},${q(p.image)},${p.id}) on conflict(id) do update set name=excluded.name,price_cents=excluded.price_cents,description=excluded.description,image_url=excluded.image_url;\n`;
for(const s of catalog.stores)for(const p of catalog.products)sql+=`insert into public.store_product_availability(store_id,product_id,available) values(${s.id},${p.id},${catalog.menus[s.id].includes(p.id)}) on conflict(store_id,product_id) do update set available=excluded.available;\n`;
for(const table of ['stores','categories','products'])sql+=`select setval(pg_get_serial_sequence('public.${table}','id'),greatest((select max(id) from public.${table}),1));\n`;
sql+=`insert into public.campaigns(id,title,body,image_url,sort_order) values(1,${q(brand.tagline)},${q(brand.description)},${q(brand.heroImage)},0) on conflict(id) do update set title=excluded.title,body=excluded.body,image_url=excluded.image_url;\nselect setval(pg_get_serial_sequence('public.campaigns','id'),greatest((select max(id) from public.campaigns),1));\n`;
for(const [slug,route,title,type]of [['home','/','Home','rich_text'],['menu','/menu','Menu','product_catalog'],['story','/story','About the demo','rich_text'],['stores','/stores','Branches','store_list']]){
 const content={sections:[{id:slug+'-intro',type:'hero',heading:brand.tagline,body:brand.notice,imageUrl:brand.heroImage,background:'navy',buttonLabel:'Try pickup',buttonUrl:brand.urls.order},{id:slug+'-content',type,heading:title,body:brand.description,background:'cream'}]};
 sql+=`insert into public.website_pages(title,slug,route_path,is_system,draft_content) values(${q(title)},${q(slug)},${q(route)},true,${q(JSON.stringify(content))}::jsonb) on conflict(slug) do nothing;\n`;
}
sql+=`update public.reward_settings set points_enabled=true,stamp_enabled=false;\n`;
sql+=`update public.voucher_templates set title='Demo Treat: Buy 2, Free 1' where id=1 and voucher_type='buy_x_free_one';\nupdate public.voucher_codes set code='DEMOWELCOME' where id=1;\nupdate public.voucher_codes set code='DEMOBUY2' where id=2;\n`;
fs.writeFileSync('supabase/seed.sql',sql);
