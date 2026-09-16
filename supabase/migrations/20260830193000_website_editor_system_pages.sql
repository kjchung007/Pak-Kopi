alter table public.website_pages
  add column if not exists route_path text,
  add column if not exists is_system boolean not null default false;

update public.website_pages set route_path='/'||slug where route_path is null;
alter table public.website_pages alter column route_path set not null;
alter table public.website_pages add constraint website_pages_route_path_format check (route_path='/' or route_path ~ '^/[a-z0-9]+(?:-[a-z0-9]+)*$');
create unique index if not exists website_pages_route_path_unique on public.website_pages(route_path);

notify pgrst,'reload schema';
