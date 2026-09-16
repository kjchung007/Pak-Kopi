import fs from 'node:fs';import assert from 'node:assert/strict';
const {url,publishableKey}=JSON.parse(fs.readFileSync('.demo/cloud-connection.json'));
const a=JSON.parse(fs.readFileSync('.demo/cloud-accounts.json')).find(a=>a.role==='customer');
const r=await fetch(url+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:publishableKey,'Content-Type':'application/json'},body:JSON.stringify({email:a.email,password:a.password})});
const s=await r.json();assert.equal(r.status,200);
const test=JSON.parse(fs.readFileSync('artifacts/hitpay-sandbox-test.json'));
for(let i=0;i<2;i++){
 const response=await fetch(url+'/functions/v1/reconcile-hitpay-payment',{method:'POST',headers:{apikey:publishableKey,Authorization:'Bearer '+s.access_token,'Content-Type':'application/json'},body:JSON.stringify({order_id:test.orderId})});
 const data=await response.json();console.log('Verified result',response.status,data);assert.equal(data.payment_status,'paid');
}
console.log('PASS provider-verified success and repeat reconciliation');
