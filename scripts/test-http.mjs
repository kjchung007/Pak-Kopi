import fs from 'node:fs';
import assert from 'node:assert/strict';
const cloud=process.argv.includes('--cloud');
const connection=cloud?JSON.parse(fs.readFileSync('.demo/cloud-connection.json')):null;
const base=connection?.url||'http://127.0.0.1:54321';
const accounts=JSON.parse(fs.readFileSync(cloud?'.demo/cloud-accounts.json':'.demo/accounts.json'));
async function login(role,store){const a=accounts.find(a=>a.role===role&&(store===undefined||a.store===store));const r=await fetch(base+'/auth/v1/token?grant_type=password',{method:'POST',headers:{'content-type':'application/json',apikey:connection?.publishableKey||'local-demo-public'},body:JSON.stringify(a)});const b=await r.json();assert.equal(r.status,200,JSON.stringify(b));return b.access_token}
async function request(route,token,method='GET',body){const r=await fetch(base+route,{method,headers:{'content-type':'application/json',apikey:connection?.publishableKey||'local-demo-public',Prefer:'return=representation',...(token?{Authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json()}}
const customer=await login('customer'),staff=await login('staff',1),other=await login('staff',2),admin=await login('global_admin');
let r=await request('/rest/v1/products?select=id,name,categories(name)',customer);assert.equal(r.status,200,JSON.stringify(r.data));assert(r.data[0].categories.name);
r=await request('/rest/v1/rpc/create_pickup_order',customer,'POST',{p_customer_name:'HTTP test',p_store_id:1,p_items:[{product_id:1,quantity:1,customization:{size:'Regular',temperature:'Iced'}}],p_user_voucher_id:null,p_secret_code:null,p_payment_method:'fpx'});assert.equal(r.status,200,JSON.stringify(r.data));const id=r.data.id;assert.equal(r.data.total_cents,720);
r=await request('/rest/v1/rpc/complete_demo_payment',customer,'POST',{p_order_id:id});assert.equal(r.status,200,JSON.stringify(r.data));assert.equal(r.data.payment_status,'paid');
r=await request('/rest/v1/orders?select=id,order_items(product_name),stores(name)&id=eq.'+id,other);assert.equal(r.data.length,0);
for(const status of ['preparing','ready','completed']){r=await request('/rest/v1/orders?id=eq.'+id,staff,'PATCH',{status});assert.equal(r.status,200,JSON.stringify(r.data));assert.equal(r.data[0].status,status);}
r=await request('/rest/v1/waiting_board_entries?order_id=eq.'+id,'');assert.deepEqual(r.data,[]);
r=await request('/rest/v1/orders?id=eq.'+id,staff,'PATCH',{total_cents:1});assert(r.status>=400);
r=await request('/rest/v1/staff?select=role,store_id',admin);assert.equal(r.data.length,4);
console.log('PASS HTTP login, relational menu, authoritative price, demo payment, branch isolation, queue lifecycle and tamper rejection');

