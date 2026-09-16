import fs from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
const db=new PGlite();
await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
create schema auth;create schema storage;create schema extensions;
create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb default '{}',is_anonymous boolean default false,created_at timestamptz default now());
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
grant usage on schema auth to anon,authenticated;grant execute on all functions in schema auth to anon,authenticated;
create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid,name text,bucket_id text,owner uuid);alter table storage.objects enable row level security;
create publication supabase_realtime;`);
for(const file of fs.readdirSync('supabase/migrations').sort()){
 try{await db.exec(fs.readFileSync(`supabase/migrations/${file}`,'utf8'));console.log('PASS',file)}catch(e){console.error('FAIL',file,e.message);console.error(e.query?.slice(0,150));process.exit(1)}
}
if(fs.existsSync('supabase/seed.sql'))await db.exec(fs.readFileSync('supabase/seed.sql','utf8'));
console.log('Fresh database migrations and seed passed');
if(fs.existsSync('tests/database-scenarios.sql'))await db.exec(fs.readFileSync('tests/database-scenarios.sql','utf8'));
if(fs.existsSync('tests/hitpay-sandbox-scenarios.sql'))await db.exec(fs.readFileSync('tests/hitpay-sandbox-scenarios.sql','utf8'));
if(fs.existsSync('tests/website-workspace-scenarios.sql'))await db.exec(fs.readFileSync('tests/website-workspace-scenarios.sql','utf8'));
console.log('PASS database isolation, totals and sandbox payment scenarios');
await db.close();
