import fs from 'node:fs';
import assert from 'node:assert/strict';
const {url,publishableKey}=JSON.parse(fs.readFileSync('.demo/cloud-connection.json'));
const a=JSON.parse(fs.readFileSync('.demo/cloud-accounts.json')).find(a=>a.role==='customer');
const login=await fetch(url+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:publishableKey,'Content-Type':'application/json'},body:JSON.stringify({email:a.email,password:a.password})});
const session=await login.json();assert.equal(login.status,200);
const headers={apikey:publishableKey,Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'};
async function rpc(name,body){const r=await fetch(url+'/rest/v1/rpc/'+name,{method:'POST',headers,body:JSON.stringify(body)});return {status:r.status,data:await r.json()};}
async function fn(name,body,h=headers){const r=await fetch(url+'/functions/v1/'+name,{method:'POST',headers:h,body:JSON.stringify(body)});return {status:r.status,data:await r.json()};}
const products=await fetch(url+'/rest/v1/products?select=id,size_options,temperature_options&available=eq.true&order=id&limit=1',{headers}).then(r=>r.json());
const product=products[0];
const created=await rpc('create_pickup_order',{p_customer_name:'Sandbox integration test',p_store_id:1,p_items:[{product_id:product.id,quantity:1,customization:{size:product.size_options[0].name,temperature:product.temperature_options[0]}}],p_user_voucher_id:null,p_secret_code:null,p_payment_method:'card'});
assert.equal(created.status,200,JSON.stringify(created.data));
const id=created.data.id;
assert.notEqual((await rpc('complete_demo_payment',{p_order_id:id})).status,200,'simulated payment must be disabled');
assert.notEqual((await fn('create-hitpay-payment',{order_id:id,origin:'https://example.com'})).status,200,'foreign redirect must be rejected');
assert.notEqual((await fn('create-hitpay-payment',{order_id:id,origin:'http://localhost:5173'},{apikey:publishableKey,'Content-Type':'application/json'})).status,200,'anonymous checkout must be rejected');
const result=await fn('create-hitpay-payment',{order_id:id,origin:'http://localhost:5173'});
console.log('CREATE',result.status,JSON.stringify(result.data));
assert.equal(result.status,200);
const again=await fn('create-hitpay-payment',{order_id:id,origin:'http://localhost:5173'});
assert.equal(again.data.payment_request_id,result.data.payment_request_id,'retry must reuse the same checkout');
const status=await fn('reconcile-hitpay-payment',{order_id:id});assert.equal(status.data.payment_status,'pending');
const forged=await fn('hitpay-webhook',{id:result.data.payment_request_id,status:'completed'});assert.equal(forged.status,401);
fs.writeFileSync('artifacts/hitpay-sandbox-test.json',JSON.stringify({orderId:id,...result.data},null,2));
console.log('PASS sandbox create, retry reuse, pending reconciliation, blocked simulation, anonymous/redirect/signature guards');
