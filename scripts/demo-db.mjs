import fs from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
export async function openDemoDatabase(dataDir){
 const db=new PGlite(dataDir);
 const exists=await db.query("select to_regclass('private.demo_settings') as present");
 if(!exists.rows[0].present){
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
 create schema auth;create schema storage;create schema extensions;
 create table auth.users(id uuid primary key,email text unique,email_confirmed_at timestamptz,raw_user_meta_data jsonb default '{}',is_anonymous boolean default false,created_at timestamptz default now());
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
 grant usage on schema auth to anon,authenticated;grant execute on all functions in schema auth to anon,authenticated;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid,name text,bucket_id text,owner uuid);alter table storage.objects enable row level security;
 create publication supabase_realtime;`);
 for(const file of fs.readdirSync('supabase/migrations').sort())await db.exec(fs.readFileSync(`supabase/migrations/${file}`,'utf8'));
 await db.exec(fs.readFileSync('supabase/seed.sql','utf8'));
 }
 return db;
}
