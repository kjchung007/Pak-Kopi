// Local presentation adapter. Uses the same PostgreSQL schema, RPCs and RLS as
// the hosted backend. No production credentials or payment gateway are used.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID,randomBytes,scryptSync,timingSafeEqual} from 'node:crypto';
import {openDemoDatabase} from './demo-db.mjs';
const port=Number(process.env.DEMO_PORT||54321);
fs.mkdirSync('.demo',{recursive:true});
const db=await openDemoDatabase('.demo/database');
await db.exec('create table if not exists private.demo_passwords(user_id uuid primary key references auth.users(id) on delete cascade,salt text not null,hash text not null)');
const sessions=new Map();let queue=Promise.resolve();
const serial=fn=>{const result=queue.then(fn);queue=result.catch(()=>{});return result};
const ident=s=>{if(!/^[a-z_][a-z0-9_]*$/.test(s))throw Error('Invalid identifier');return '"'+s+'"'};
const userJson=u=>({...u,aud:'authenticated',role:'authenticated',confirmed_at:u.email_confirmed_at,user_metadata:u.raw_user_meta_data,app_metadata:{provider:'email',providers:['email']},identities:[{id:u.id,user_id:u.id,provider:'email',identity_data:{email:u.email}}]});
async function createUser(email,password,name){
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||password.length<8)throw Error('Use a valid email and at least eight password characters');
 const id=randomUUID(),salt=randomBytes(16).toString('hex');
 await db.query('insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,$2,now(),$3)',[id,email.toLowerCase(),JSON.stringify({display_name:name})]);
 await db.query('insert into private.demo_passwords values($1,$2,$3)',[id,salt,scryptSync(password,salt,32).toString('hex')]);return id;
}
if(!(await db.query('select 1 from private.demo_passwords limit 1')).rows.length){
 const accounts=[];
 const catalog=JSON.parse(fs.readFileSync('packages/brand/catalog.json'));
 for(const [email,name,role,store]of [['owner@demo.test','Demo Owner','global_admin',null],...catalog.stores.map(s=>[`branch${s.id}@demo.test`,`${s.name} Counter`,'staff',s.id]),['customer@demo.test','Demo Customer',null,null]]){
  const password=randomBytes(12).toString('base64url'),id=await createUser(email,password,name);
  if(role){await db.query('insert into public.staff(user_id,display_name,email,role,store_id) values($1,$2,$3,$4,$5)',[id,name,email,role,store]);if(role==='global_admin')await db.query('insert into public.admin_users values($1)',[id]);}
  accounts.push({email,password,role:role||'customer',store});
 }
 fs.writeFileSync('.demo/accounts.json',JSON.stringify(accounts,null,2));
}
const tables=new Set((await db.query("select tablename from pg_tables where schemaname='public'")).rows.map(r=>r.tablename));
const columns=(await db.query("select table_name,column_name,data_type from information_schema.columns where table_schema='public'")).rows;
const encode=(table,key,value)=>{
 if(Array.isArray(value)&&columns.some(c=>c.table_name===table&&c.column_name===key&&c.data_type==='ARRAY'))return '{'+value.map(v=>'"'+String(v).replaceAll('\\','\\\\').replaceAll('"','\\"')+'"').join(',')+'}';
 return typeof value==='object'&&value!==null?JSON.stringify(value):value;
};
const relationships=(await db.query(`select s.relname as source,t.relname as target,sa.attname as source_key,ta.attname as target_key from pg_constraint c join pg_class s on s.oid=c.conrelid join pg_class t on t.oid=c.confrelid join pg_namespace n on n.oid=s.relnamespace join pg_attribute sa on sa.attrelid=c.conrelid and sa.attnum=c.conkey[1] join pg_attribute ta on ta.attrelid=c.confrelid and ta.attnum=c.confkey[1] where c.contype='f' and n.nspname='public'`)).rows;
const split=s=>{let depth=0,start=0,out=[];for(let i=0;i<s.length;i++){if(s[i]==='(')depth++;if(s[i]===')')depth--;if(s[i]===','&&!depth){out.push(s.slice(start,i));start=i+1}}out.push(s.slice(start));return out.filter(Boolean)};
function projection(table,select,alias='t',depth=0){
 if(depth>4)throw Error('Relation nesting too deep');
 let pairs=[],star=false;
 for(const part of split(select||'*')){
  if(part==='*'){star=true;continue}
  if(part.includes('(')){
   const pos=part.indexOf('('),name=part.slice(0,pos).split('!')[0],inner=part.slice(pos+1,-1),child=`r${depth}`;
   if(!tables.has(name))throw Error('Unknown relation');
   const direct=relationships.find(r=>r.source===table&&r.target===name),reverse=relationships.find(r=>r.target===table&&r.source===name),rel=direct||reverse;
   if(!rel)throw Error('Unknown relation');
   const cond=direct?`${child}.${ident(rel.target_key)}=${alias}.${ident(rel.source_key)}`:`${child}.${ident(rel.source_key)}=${alias}.${ident(rel.target_key)}`;
   const expr=projection(name,inner,child,depth+1);
   pairs.push(`'${name}',(select ${direct?expr:`coalesce(jsonb_agg(${expr}),'[]'::jsonb)`} from public.${ident(name)} ${child} where ${cond}${direct?' limit 1':''})`);
  }else{const bits=part.split(':'),column=bits.at(-1);pairs.push(`'${ident(bits[0]).slice(1,-1)}',${alias}.${ident(column)}`)}
 }
 return `${star?`to_jsonb(${alias})`:`'{}'::jsonb`}${pairs.length?` || jsonb_build_object(${pairs.join(',')})`:''}`;
}
function where(params,values){const clauses=[];for(const [key,value]of params){if(['select','order','limit','offset','on_conflict','columns'].includes(key))continue;let [op,...rest]=value.split('.'),v=rest.join('.'),neg=false;if(op==='not'){neg=true;[op,...rest]=rest;v=rest.join('.')};let sql;
 const col=ident(key);if(op==='is'){if(!['null','true','false'].includes(v))throw Error('Invalid filter');sql=`${col} is ${v}`}
 else if(op==='in'){const list=v.slice(1,-1).split(',');const placeholders=list.map(x=>{values.push(x.replace(/^"|"$/g,''));return '$'+values.length});sql=`${col} in (${placeholders.join(',')})`}
 else{const ops={eq:'=',neq:'<>',gt:'>',gte:'>=',lt:'<',lte:'<=',ilike:'ilike'};if(!ops[op])throw Error('Unsupported filter');values.push(v==='true'?true:v==='false'?false:v);sql=`${col} ${ops[op]} $${values.length}`}
 clauses.push(neg?`not (${sql})`:sql);
 }return clauses.length?' where '+clauses.join(' and '):'';}
const tokenFor=id=>{const token=randomBytes(32).toString('base64url');sessions.set(token,{id,expires:Date.now()+86400000});return token};
async function authResponse(id){const u=(await db.query('select * from auth.users where id=$1',[id])).rows[0];return {access_token:tokenFor(id),refresh_token:tokenFor(id),token_type:'bearer',expires_in:86400,expires_at:Math.floor(Date.now()/1000)+86400,user:userJson(u)}}
async function handle(req,res){
 const origin=req.headers.origin;const origins=new Set(['http://localhost:3000','http://localhost:5173','http://localhost:5174','http://localhost:5175','http://127.0.0.1:3000','http://127.0.0.1:5173','http://127.0.0.1:5174','http://127.0.0.1:5175']);
 if(origin&&!origins.has(origin)){res.writeHead(403);res.end();return}
 res.setHeader('Access-Control-Allow-Origin',origin||'http://localhost:5173');res.setHeader('Vary','Origin, Access-Control-Request-Headers');res.setHeader('Access-Control-Allow-Headers',req.headers['access-control-request-headers']||'authorization,apikey,content-type,x-client-info,prefer,range,x-supabase-api-version,accept-profile,content-profile,x-retry-count');res.setHeader('Access-Control-Allow-Methods','GET,HEAD,POST,PATCH,PUT,DELETE,OPTIONS');res.setHeader('Access-Control-Expose-Headers','content-range');res.setHeader('Cache-Control','no-store');
 if(req.method==='OPTIONS'){res.writeHead(204);res.end();return}
 const send=(body,status=200)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(req.method==='HEAD'?'':JSON.stringify(body))};
 try{
 const url=new URL(req.url,`http://localhost:${port}`),route=url.pathname;
 const chunks=[];let length=0;for await(const chunk of req){chunks.push(chunk);length+=chunk.length;if(length>5_000_000)throw Error('Request too large')};const raw=Buffer.concat(chunks);const body=raw.length&&req.headers['content-type']?.includes('application/json')?JSON.parse(raw.toString()):{};
 await serial(async()=>{
 const bearer=req.headers.authorization?.replace(/^Bearer /i,''),session=sessions.get(bearer),uid=session&&session.expires>Date.now()?session.id:null;
 if(route==='/health'){send({ok:true,mode:'local-demo'});return}
 if(route==='/auth/v1/token'){
  if(url.searchParams.get('grant_type')==='refresh_token'){const refresh=sessions.get(body.refresh_token);if(!refresh||refresh.expires<Date.now())throw Error('Session expired');send(await authResponse(refresh.id));return}
  const found=(await db.query('select u.id,p.salt,p.hash from auth.users u join private.demo_passwords p on p.user_id=u.id where u.email=$1',[String(body.email).toLowerCase()])).rows[0];
  if(!found||!timingSafeEqual(scryptSync(String(body.password),found.salt,32),Buffer.from(found.hash,'hex')))throw Error('Invalid login credentials');send(await authResponse(found.id));return;
 }
 if(route==='/auth/v1/signup'){const id=await createUser(String(body.email),String(body.password),body.data?.display_name||'Demo customer');send(await authResponse(id));return}
 if(route==='/auth/v1/logout'){if(uid)for(const [token,s]of sessions)if(s.id===uid)sessions.delete(token);send({});return}
 if(route==='/auth/v1/user'){
  if(!uid)throw Error('Sign in required');
  if(req.method==='PUT'){
   if(body.data)await db.query('update auth.users set raw_user_meta_data=raw_user_meta_data||$1::jsonb where id=$2',[JSON.stringify(body.data),uid]);
   if(body.password){if(body.password.length<8)throw Error('Password must be at least eight characters');const salt=randomBytes(16).toString('hex');await db.query('update private.demo_passwords set salt=$1,hash=$2 where user_id=$3',[salt,scryptSync(body.password,salt,32).toString('hex'),uid]);}
  }
  const u=(await db.query('select * from auth.users where id=$1',[uid])).rows[0];if(!u)throw Error('Session expired');send(userJson(u));return;
 }
 if(route.startsWith('/auth/')){throw Error('Use a demo email/password account. Email delivery and social sign-in are not configured for local previews.')}
 if(route.startsWith('/storage/v1/object/')){
  const relative=decodeURIComponent(route.replace('/storage/v1/object/','').replace(/^public\//,''));
  const storageRoot=path.resolve('.demo/uploads'),file=path.resolve(storageRoot,relative);
  if(!file.startsWith(storageRoot+path.sep)||!/^[-\w./ ]+\.(png|jpe?g|webp|gif)$/i.test(relative))throw Error('Only image uploads with safe paths are supported');
  if(req.method==='GET'){
   if(!fs.existsSync(file))throw Error('Image not found');res.writeHead(200,{'Content-Type':/\.png$/i.test(file)?'image/png':/\.webp$/i.test(file)?'image/webp':/\.gif$/i.test(file)?'image/gif':'image/jpeg'});res.end(fs.readFileSync(file));return;
  }
  const staff=(await db.query('select role from public.staff where user_id=$1 and active',[uid])).rows[0];if(staff?.role!=='global_admin')throw Error('Owner access required');
  let bytes=raw;if(req.headers['content-type']?.startsWith('multipart/form-data')){const form=await new Response(raw,{headers:{'content-type':req.headers['content-type']}}).formData();const upload=[...form.values()].find(v=>typeof v!=='string');if(!upload)throw Error('Missing image');bytes=Buffer.from(await upload.arrayBuffer());}
  fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,bytes);send({Key:relative,Id:randomUUID()});return;
 }
 if(route.startsWith('/functions/')){
  if(!uid)throw Error('Sign in required');
  const fn=route.split('/').at(-1),operator=(await db.query('select * from public.staff where user_id=$1 and active',[uid])).rows[0];
  const removeUser=async id=>{await db.query('delete from auth.users where id=$1',[id]);for(const [token,s]of sessions)if(s.id===id)sessions.delete(token)};
  if(fn==='reconcile-hitpay-payment'){const r=(await db.query('select payment_status from public.orders where id=$1 and user_id=$2',[body.order_id,uid])).rows[0];if(!r)throw Error('Order not found');send(r);return}
  if(fn==='delete-my-account'){if(operator)throw Error('Team accounts must be managed by the owner');await removeUser(uid);send({ok:true});return}
  if(operator?.role!=='global_admin')throw Error('Owner access required');
  if(fn==='create-staff-account'){
   const role=body.role;if(!['staff','store_manager'].includes(role))throw Error('Choose staff or store manager');
   const store=body.store_id??body.storeId;if(!(await db.query('select 1 from public.stores where id=$1 and active',[store])).rows.length)throw Error('Choose an active branch');
   const id=await createUser(String(body.email),String(body.password),body.display_name??body.displayName??'Team member');
   await db.query('insert into public.staff(user_id,role,store_id,display_name,email) values($1,$2,$3,$4,$5)',[id,role,store,body.display_name??body.displayName??'Team member',body.email]);send({ok:true,userId:id});return;
  }
  if(fn==='admin-control'&&['delete_staff','delete_customer'].includes(body.action)){
   if(body.targetId===uid)throw Error('Cannot delete the signed-in owner');
   const target=(await db.query('select role from public.staff where user_id=$1',[body.targetId])).rows[0];
   if(target?.role==='global_admin')throw Error('Owner accounts cannot be deleted in the demo');
   if(body.action==='delete_customer'&&target)throw Error('Use team management for staff accounts');
   await removeUser(body.targetId);send({ok:true});return;
  }
  if(fn==='admin-control'&&body.action==='system_reset'){
   const phrases={customers:'WIPE CUSTOMERS',products:'WIPE PRODUCTS',stores_team:'WIPE STORES AND TEAM',factory:'FACTORY RESET'};
   if(!phrases[body.reset]||body.confirmation!==phrases[body.reset])throw Error('Exact confirmation required');
   await db.exec('begin');let deleted=0;
   try{
    if(['customers','factory'].includes(body.reset)){const ids=(await db.query('select id from auth.users where id not in(select user_id from public.staff)')).rows;for(const {id}of ids){await removeUser(id);deleted++;}}
    if(['products','factory'].includes(body.reset))await db.exec('delete from public.products;delete from public.categories;');
    if(['stores_team','factory'].includes(body.reset)){const ids=(await db.query('select user_id as id from public.staff where user_id<>$1',[uid])).rows;for(const {id}of ids){await removeUser(id);deleted++;}await db.exec('delete from public.orders;delete from public.stores;');}
    if(body.reset==='factory')await db.exec('delete from public.campaigns;delete from public.user_vouchers;delete from public.voucher_codes;update public.reward_settings set stamp_reward_template_id=null;delete from public.voucher_templates;');
    await db.exec('commit');send({ok:true,deletedAuthAccounts:deleted});return;
   }catch(e){await db.exec('rollback');throw e}
  }
  throw Error('Payment gateway is disabled in this demo');
 }
 await db.exec('begin');
 try{
 await db.query("select set_config('request.jwt.claim.sub',$1,true)",[uid||'']);
 await db.query("select set_config('request.jwt.claims',$1,true)",[JSON.stringify({sub:uid,is_anonymous:false})]);
 await db.exec(`set local role ${uid?'authenticated':'anon'}`);
 if(route.startsWith('/rest/v1/rpc/')){
  const fn=route.split('/').at(-1);ident(fn);
  const keys=Object.keys(body);const values=keys.map(k=>typeof body[k]==='object'&&body[k]!==null?JSON.stringify(body[k]):body[k]);
  const args=keys.map((k,i)=>`${ident(k)} := $${i+1}`).join(',');
  const result=await db.query(`select to_jsonb(public.${ident(fn)}(${args})) as result`,values);await db.exec('commit');send(result.rows[0]?.result??null);return;
 }
 const table=route.replace('/rest/v1/','');if(!tables.has(table))throw Error('Unknown endpoint');
 let values=[],filter=where(url.searchParams,values),rows;
 if(['GET','HEAD'].includes(req.method)){
  const order=url.searchParams.get('order');let suffix='';if(order)suffix=' order by '+order.split(',').map(s=>{const [col,dir]=s.split('.');return ident(col)+(dir==='desc'?' desc':' asc')}).join(',');
  const limit=Math.min(Number(url.searchParams.get('limit')||1000),1000),offset=Number(url.searchParams.get('offset')||0);if(!Number.isInteger(limit)||limit<0||!Number.isInteger(offset)||offset<0)throw Error('Invalid range');
  rows=(await db.query(`select ${projection(table,url.searchParams.get('select')||'*')} as result from public.${ident(table)} t${filter}${suffix} limit ${limit} offset ${offset}`,values)).rows.map(r=>r.result);
 }else if(req.method==='POST'){
  rows=[];for(const record of Array.isArray(body)?body:[body]){const keys=Object.keys(record),vals=keys.map(k=>encode(table,k,record[k]));
   let conflict='';if(req.headers.prefer?.includes('resolution=merge-duplicates')){const cols=(url.searchParams.get('on_conflict')|| (keys.includes('id')?'id':keys.includes('user_id')?'user_id':'store_id,product_id')).split(',');conflict=` on conflict(${cols.map(ident).join(',')}) do update set `+keys.filter(k=>!cols.includes(k)).map(k=>`${ident(k)}=excluded.${ident(k)}`).join(',');}
   rows.push(...(await db.query(`insert into public.${ident(table)}(${keys.map(ident).join(',')}) values(${keys.map((_,i)=>'$'+(i+1)).join(',')})${conflict} returning *`,vals)).rows);
  }
 }else if(req.method==='PATCH'){
  const assignments=Object.entries(body).map(([k,v])=>{values.push(encode(table,k,v));return `${ident(k)}=$${values.length}`});rows=(await db.query(`update public.${ident(table)} set ${assignments.join(',')}${filter} returning *`,values)).rows;
 }else if(req.method==='DELETE'){rows=(await db.query(`delete from public.${ident(table)}${filter} returning *`,values)).rows}else throw Error('Unsupported method');
 await db.exec('commit');res.setHeader('content-range',`0-${Math.max(rows.length-1,0)}/${rows.length}`);
 if(req.headers.accept?.includes('vnd.pgrst.object')){if(rows.length!==1){send({code:'PGRST116',message:`Expected one row, found ${rows.length}`,details:`The result contains ${rows.length} rows`},406);return}send(rows[0]);}else send(rows);
 }catch(e){await db.exec('rollback');throw e}
 });
 }catch(e){send({message:e.message,error:e.message,code:e.code||'DEMO_ERROR'},400)}
}
http.createServer(handle).listen(port,'127.0.0.1',()=>console.log(`Local demo database ready at http://localhost:${port}. Login details: .demo/accounts.json`));
