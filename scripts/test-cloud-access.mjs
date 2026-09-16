import fs from 'node:fs';
import assert from 'node:assert/strict';
const {url,publishableKey}=JSON.parse(fs.readFileSync('.demo/cloud-connection.json'));
const a=JSON.parse(fs.readFileSync('.demo/cloud-accounts.json')).find(a=>a.role==='global_admin');
const login=await fetch(url+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:publishableKey,'Content-Type':'application/json'},body:JSON.stringify({email:a.email,password:a.password})});const session=await login.json();assert.equal(login.status,200);
for(const [name,status]of [['create-staff-account',400],['admin-control',400],['delete-my-account',403],['provision-demo-once',410]]){
 const r=await fetch(url+'/functions/v1/'+name,{method:'POST',headers:{apikey:publishableKey,'Content-Type':'application/json',Authorization:'Bearer '+session.access_token},body:'{}'});const result=await r.text();assert.equal(r.status,status,name+': '+result);console.log('PASS protected function',name);
}
const noAuth=await fetch(url+'/functions/v1/admin-control',{method:'POST',headers:{apikey:publishableKey,'Content-Type':'application/json'},body:'{}'});assert.equal(noAuth.status,401);
console.log('PASS anonymous administrative access denied');
