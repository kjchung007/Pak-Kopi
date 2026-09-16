create table public.website_public(id integer primary key check(id=1),content jsonb not null,published_at timestamptz not null default now());
alter table public.website_public enable row level security;
create policy website_public_read on public.website_public for select to anon,authenticated using(true);
grant select on public.website_public to anon,authenticated;
revoke insert,update,delete on public.website_public from anon,authenticated;
create table private.website_workspace(id integer primary key check(id=1),content jsonb not null,revision integer not null default 1,updated_at timestamptz not null default now());
create table private.website_releases(id bigint generated always as identity primary key,content jsonb not null,created_at timestamptz not null default now(),created_by uuid);
create table private.website_preview_links(token uuid primary key default gen_random_uuid(),expires_at timestamptz not null default now()+interval '1 hour',created_by uuid);
revoke all on private.website_workspace,private.website_releases,private.website_preview_links from public,anon,authenticated;

create function private.validate_website_document(doc jsonb) returns void language plpgsql set search_path='' as $$
declare value jsonb;
begin
 if doc->>'schema' is distinct from '1' or jsonb_typeof(doc->'copy') is distinct from 'object' or jsonb_typeof(doc->'images') is distinct from 'object' or jsonb_typeof(doc->'stores') is distinct from 'array' or jsonb_typeof(doc->'products') is distinct from 'array' or octet_length(doc::text)>1000000 then raise exception 'Invalid website document';end if;
 if jsonb_array_length(doc->'stores')>100 or jsonb_array_length(doc->'products')>1000 then raise exception 'Too many entries';end if;
 for value in select v from jsonb_each(doc->'copy') t(k,v) loop
  if jsonb_typeof(value)<>'string' or length(value#>>'{}')>10000 then raise exception 'Invalid website text';end if;
 end loop;
 for value in select v from jsonb_each(doc->'images') t(k,v) loop
  if jsonb_typeof(value)<>'string' or (value#>>'{}') !~ '^(/brand/|https://)' then raise exception 'Use a brand image or HTTPS image URL';end if;
 end loop;
 for value in select v from jsonb_array_elements(doc->'stores') t(v) loop
  if coalesce(length(value->>'name'),0) not between 1 and 180 or coalesce(length(value->>'address'),0)>1000 or coalesce(value->>'image','') !~ '^(/brand/|https://)' then raise exception 'Invalid branch name, address or image';end if;
  if (value->>'id')::bigint<0 and coalesce((value->>'acceptingPickup')::boolean,false) then raise exception 'New website listings cannot enable ordering';end if;
 end loop;
end $$;
revoke all on function private.validate_website_document(jsonb) from public,anon,authenticated;

create function public.website_workspace_action(p_action text,p_content jsonb default null,p_revision integer default null,p_version bigint default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare d private.website_workspace; result jsonb; token uuid;
begin
 if not exists(select 1 from public.staff where user_id=auth.uid() and active and role='global_admin') then raise exception 'Global administrator access required';end if;
 if p_action='load' then
  if not exists(select 1 from private.website_workspace) then
   perform private.validate_website_document(p_content);
   insert into private.website_workspace(id,content) values(1,coalesce((select content from public.website_public where id=1),p_content)) on conflict do nothing;
  end if;
 end if;
 select * into d from private.website_workspace where id=1 for update;
 if not found then raise exception 'Start a website draft first';end if;
 if p_action in ('save','publish','restore','reset') and p_revision is distinct from d.revision then raise exception 'This draft was changed elsewhere. Reload before saving.';end if;
 if p_action='save' then
  perform private.validate_website_document(p_content);
  update private.website_workspace set content=p_content,revision=revision+1,updated_at=now() where id=1;
 elsif p_action='publish' then
  perform private.validate_website_document(d.content);
  -- Archive the currently live document before replacing it, including first publish.
  insert into private.website_releases(content,created_by) values(coalesce((select content from public.website_public where id=1),p_content),auth.uid());
  insert into public.website_public(id,content) values(1,d.content) on conflict(id) do update set content=excluded.content,published_at=now();
  update private.website_workspace set revision=revision+1 where id=1;
  insert into public.admin_audit_logs(admin_id,action_type,target_id,details_json) values(auth.uid(),'website.site_published','1','{}');
 elsif p_action='restore' then
  select content into result from private.website_releases where id=p_version;
  if result is null then raise exception 'Version not found';end if;
  update private.website_workspace set content=result,revision=revision+1,updated_at=now() where id=1;
 elsif p_action='reset' then
  perform private.validate_website_document(p_content);
  update private.website_workspace set content=coalesce((select content from public.website_public where id=1),p_content),revision=revision+1,updated_at=now() where id=1;
 elsif p_action='preview' then
  insert into private.website_preview_links(created_by) values(auth.uid()) returning website_preview_links.token into token;
  return jsonb_build_object('token',token,'expiresIn',3600);
 elsif p_action='revoke_previews' then
  delete from private.website_preview_links;
 elsif p_action<>'load' then raise exception 'Unknown website action';
 end if;
 select * into d from private.website_workspace where id=1;
 return jsonb_build_object('content',d.content,'revision',d.revision,'versions',coalesce((select jsonb_agg(v) from (select id,created_at from private.website_releases order by id desc limit 10) v),'[]'::jsonb));
end $$;
revoke all on function public.website_workspace_action(text,jsonb,integer,bigint) from public,anon;
grant execute on function public.website_workspace_action(text,jsonb,integer,bigint) to authenticated;
create function public.read_website_preview(p_token uuid) returns jsonb language sql security definer set search_path='' as $$
 select w.content from private.website_workspace w where w.id=1 and exists(select 1 from private.website_preview_links l join public.staff s on s.user_id=l.created_by and s.active and s.role='global_admin' where l.token=p_token and l.expires_at>now());
$$;
revoke all on function public.read_website_preview(uuid) from public;
grant execute on function public.read_website_preview(uuid) to anon,authenticated;
-- Legacy published rows must not expose their draft_content column publicly.
drop policy if exists public_reads_published_website_pages on public.website_pages;
create policy public_reads_published_website_pages on public.website_pages for select to anon,authenticated using(exists(select 1 from public.staff s where s.user_id=auth.uid() and s.active and s.role='global_admin'));
-- Public projection deliberately excludes drafts and editing metadata.
create view public.website_published as select id,title,slug,route_path,seo_title,seo_description,published_content from public.website_pages where published_content is not null;
grant select on public.website_published to anon,authenticated;
notify pgrst,'reload schema';
