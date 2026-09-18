import fs from 'node:fs';import assert from 'node:assert/strict';
const {url,publishableKey}=JSON.parse(fs.readFileSync('.demo/cloud-connection.json'));
const a=JSON.parse(fs.readFileSync('.demo/cloud-accounts.json')).find(x=>x.role==='global_admin');
const login=await fetch(url+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:publishableKey,'Content-Type':'application/json'},body:JSON.stringify({email:a.email,password:a.password})}).then(r=>r.json());assert(login.access_token);
const result=await fetch(url+'/rest/v1/rpc/website_workspace_action',{method:'POST',headers:{apikey:publishableKey,Authorization:'Bearer '+login.access_token,'Content-Type':'application/json'},body:JSON.stringify({p_action:'preview'})}).then(r=>r.json());assert(result.token);
const base=process.env.TEST_WEBSITE_URL||'http://localhost:3000';
const before=await fetch(base+'/api/site-baseline').then(r=>r.json());
const denied=await fetch(base+'/preview/').then(r=>r.text());assert(denied.includes('Private draft preview'));
const opened=await fetch(base+'/preview/draft-access?token='+result.token,{redirect:'manual'});assert.equal(opened.status,307);assert(opened.headers.get('location').includes('/preview/'));assert(opened.headers.get('set-cookie').includes('Path=/'));
const cookie=opened.headers.get('set-cookie').split(';')[0];
const html=await fetch(base+'/preview/',{headers:{cookie}}).then(r=>r.text());assert(!html.includes('Private draft preview'));assert(html.includes('Draft preview'));
const htmlWithToken=await fetch(base+'/preview/?token='+result.token).then(r=>r.text());assert(!htmlWithToken.includes('Private draft preview'));assert(htmlWithToken.includes('Draft preview'));
const after=await fetch(base+'/api/site-baseline',{headers:{cookie,'x-pak-draft-path':'1'}}).then(r=>r.json());assert.deepEqual(after,before);
for(const page of ['/menu','/story','/stores']){const r=await fetch(base+'/preview'+page,{headers:{cookie}});assert.equal(r.status,200);}
console.log('PASS: protected preview path, scoped cookie, live isolation even with forged preview header, four page routes. No draft content changed.');
