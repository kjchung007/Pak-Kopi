-- Deleting the Auth identity frees the email for registration while preserving
-- anonymized order analytics. Volatile customer data continues to cascade.
alter table public.orders drop constraint if exists orders_user_id_fkey;
alter table public.orders
  add constraint orders_user_id_fkey foreign key (user_id)
  references auth.users(id) on delete set null;

alter table public.reward_ledger drop constraint if exists reward_ledger_user_id_fkey;
alter table public.reward_ledger
  add constraint reward_ledger_user_id_fkey foreign key (user_id)
  references auth.users(id) on delete set null;

create or replace function private.anonymize_customer_before_auth_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deleted_subject constant uuid := '00000000-0000-0000-0000-000000000001'::uuid;
begin
  if coalesce(old.is_anonymous, false)
     or exists (select 1 from public.staff s where s.user_id = old.id)
     or exists (select 1 from public.admin_users a where a.user_id = old.id) then
    return old;
  end if;

  update public.orders
  set customer_name = 'Deleted customer',
      customer_email = null,
      anonymized_customer_id = v_deleted_subject
  where user_id = old.id;

  update public.reward_ledger
  set anonymized_customer_id = v_deleted_subject
  where user_id = old.id;

  return old;
end;
$$;

revoke all on function private.anonymize_customer_before_auth_delete() from public, anon, authenticated;

drop trigger if exists anonymize_customer_before_auth_delete on auth.users;
create trigger anonymize_customer_before_auth_delete
before delete on auth.users
for each row execute function private.anonymize_customer_before_auth_delete();

-- Finish any admin deletion that removed the profile before the Auth identity.
delete from auth.users u
where not coalesce(u.is_anonymous, false)
  and not exists (select 1 from public.profiles p where p.user_id = u.id)
  and not exists (select 1 from public.staff s where s.user_id = u.id)
  and not exists (select 1 from public.admin_users a where a.user_id = u.id);

notify pgrst, 'reload schema';
