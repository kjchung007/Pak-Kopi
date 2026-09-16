import fs from 'node:fs';import assert from 'node:assert/strict';
const {url,publishableKey}=JSON.parse(fs.readFileSync('.demo/cloud-connection.json'));
const accounts=JSON.parse(fs.readFileSync('.demo/cloud-accounts.json'));
async function auth(role){const a=accounts.find(a=>a.role===role);const r=await fetch(url+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:publishableKey,'Content-Type':'application/json'},body:JSON.stringify({email:a.email,password:a.password})});assert.equal(r.status,200);return (await r.json()).access_token;}
const token=await auth('global_admin');
async function rpc(name,body,jwt=token){const r=await fetch(url+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:publishableKey,...(jwt?{Authorization:'Bearer '+jwt}:{}),'Content-Type':'application/json'},body:JSON.stringify(body)});return {status:r.status,data:await r.json()};}
const baseline=await fetch('http://localhost:3000/api/site-baseline').then(r=>r.json());
const loaded=await rpc('website_workspace_action',{p_action:'load',p_content:baseline});assert.equal(loaded.status,200,JSON.stringify(loaded.data));
const original=loaded.data.content;let revision=loaded.data.revision;
const preview=await rpc('website_workspace_action',{p_action:'preview'});assert.equal(preview.status,200);
const liveBefore=await fetch('http://localhost:3000/api/site-baseline').then(r=>r.json());
const storesBefore=await fetch(url+'/rest/v1/stores?select=id,name,image_url,accepting_pickup&order=id',{headers:{apikey:publishableKey}}).then(r=>r.json());
try{
 const changed=structuredClone(original);changed.copy['home-1']='Draft verification only';changed.stores.push({id:-123456,name:'Draft-only test branch',address:'Not published',image:'/brand/cafe-counter.jpg',phone:'',opening:'00:00',closing:'00:00',acceptingPickup:false,featured:true});
 const saved=await rpc('website_workspace_action',{p_action:'save',p_content:changed,p_revision:revision});assert.equal(saved.status,200,JSON.stringify(saved.data));revision=saved.data.revision;
 assert.notEqual((await rpc('website_workspace_action',{p_action:'save',p_content:original,p_revision:revision-1})).status,200);
 assert.deepEqual(await fetch('http://localhost:3000/api/site-baseline').then(r=>r.json()),liveBefore);
 assert.deepEqual(await fetch(url+'/rest/v1/stores?select=id,name,image_url,accepting_pickup&order=id',{headers:{apikey:publishableKey}}).then(r=>r.json()),storesBefore);
 const read=await rpc('read_website_preview',{p_token:preview.data.token},null);assert.equal(read.data.copy['home-1'],'Draft verification only');
 assert.equal((await rpc('read_website_preview',{p_token:'00000000-0000-0000-0000-000000000000'},null)).data,null);
 assert.notEqual((await rpc('website_workspace_action',{p_action:'load',p_content:baseline},await auth('customer'))).status,200);
 const opened=await fetch('http://localhost:3001/draft-access?token='+preview.data.token,{redirect:'manual'});assert.equal(opened.status,307);
 const cookie=opened.headers.get('set-cookie').split(';')[0];
 const html=await fetch('http://localhost:3001/',{headers:{cookie}}).then(r=>r.text());assert(html.includes('Draft verification only'));
 const blocked=await fetch('http://localhost:3001/').then(r=>r.text());assert(blocked.includes('Private draft preview'));assert(!blocked.includes('Draft verification only'));
 console.log('PASS draft isolation, preview gate, stale-save protection, customer denial, operational stores unchanged');
}finally{
 const restored=await rpc('website_workspace_action',{p_action:'save',p_content:original,p_revision:revision});assert.equal(restored.status,200,'Could not restore test draft; concurrent edits may need review');
}
fs.writeFileSync('artifacts/website-preview-link.json',JSON.stringify({url:'http://localhost:3001/draft-access?token='+preview.data.token},null,2));
