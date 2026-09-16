import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(new URL('../apps/admin/package.json',import.meta.url));
const {createClient}=require('@supabase/supabase-js');
const {url,publishableKey}=JSON.parse(fs.readFileSync('.demo/cloud-connection.json'));
const account=JSON.parse(fs.readFileSync('.demo/cloud-accounts.json')).find(a=>a.role==='global_admin');
const db=createClient(url,publishableKey,{auth:{persistSession:false,autoRefreshToken:false}});
assert.ifError((await db.auth.signInWithPassword({email:account.email,password:account.password})).error);
try {
 assert.ifError((await db.from('shop_settings').update({shop_name:'Pak Kopi'}).eq('id',true)).error);
 const catalog=JSON.parse(fs.readFileSync('packages/brand/catalog.json'));
 for(const s of catalog.stores.filter(s=>s.acceptingPickup===false)){
  const filename=s.image.split('/').pop();
  assert.ifError((await db.storage.from('public-assets').upload('branches/'+filename,fs.readFileSync('apps/web/public'+s.image),{upsert:true,contentType:filename.endsWith('.webp')?'image/webp':'image/jpeg'})).error);
  const image_url=db.storage.from('public-assets').getPublicUrl('branches/'+filename).data.publicUrl;
  const existing=await db.from('stores').select('id').eq('name',s.name);assert.ifError(existing.error);
  if(existing.data.length)assert.ifError((await db.from('stores').update({image_url}).eq('id',existing.data[0].id)).error);
  else assert.ifError((await db.from('stores').insert({name:s.name,address:s.address,image_url,active:true,accepting_pickup:false})).error);
  assert.equal((await fetch(image_url)).status,200);
 }
 console.log('Pak Kopi display name saved; four Sandakan branches and public photos ready. Existing products untouched.');
} finally {await db.auth.signOut();}
