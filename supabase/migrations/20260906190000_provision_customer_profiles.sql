-- Keep the public customer directory in sync with Supabase Auth.
-- The trigger is private and cannot be called through the Data API.
alter table public.profiles
  add column if not exists email text;

create or replace function private.provision_customer_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(new.is_anonymous, false) then
    return new;
  end if;

  insert into public.profiles (user_id, display_name, email, created_at)
  values (
    new.id,
    nullif(btrim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), ''),
    new.email,
    coalesce(new.created_at, now())
  )
  on conflict (user_id) do update
  set display_name = coalesce(public.profiles.display_name, excluded.display_name),
      email = excluded.email;

  return new;
end;
$$;

revoke all on function private.provision_customer_profile() from public, anon, authenticated;

drop trigger if exists provision_customer_profile on auth.users;
create trigger provision_customer_profile
after insert or update of email, raw_user_meta_data on auth.users
for each row execute function private.provision_customer_profile();

-- Repair accounts created before the trigger existed.
insert into public.profiles (user_id, display_name, email, created_at)
select
  u.id,
  nullif(btrim(coalesce(u.raw_user_meta_data ->> 'display_name', '')), ''),
  u.email,
  u.created_at
from auth.users u
where not coalesce(u.is_anonymous, false)
on conflict (user_id) do update
set display_name = coalesce(public.profiles.display_name, excluded.display_name),
    email = excluded.email;

notify pgrst, 'reload schema';
