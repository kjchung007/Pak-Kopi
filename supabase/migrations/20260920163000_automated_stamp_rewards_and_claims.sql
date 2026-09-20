-- Automated Stamp Card Reward Generation & Claims
-- Resolves issue where stamp card reaches threshold but voucher is not awarded
-- due to null stamp_reward_template_id, admin grants, or missing claim handler.

-- 1. Ensure reward_settings has a valid stamp_reward_template_id
update public.reward_settings
set stamp_reward_template_id = (
  select id from public.voucher_templates
  where active
  order by case when title ilike '%drink%' or title ilike '%free%' or title ilike '%kopi%' then 0 else 1 end, coalesce(amount_off_cents, 0) desc, id asc
  limit 1
)
where id = true and (
  stamp_reward_template_id is null
  or not exists (select 1 from public.voucher_templates v where v.id = reward_settings.stamp_reward_template_id and v.active)
);

-- 2. Core idempotent engine to process completed stamp cards into user vouchers
create or replace function private.process_customer_stamp_rewards(p_user_id uuid)
returns jsonb
language plpgsql security definer set search_path='' as $$
declare
  v_settings public.reward_settings%rowtype;
  v_account public.reward_accounts%rowtype;
  v_threshold integer;
  v_rewards integer;
  v_template public.voucher_templates%rowtype;
  v_template_id bigint;
  v_voucher_id bigint;
  v_new_vouchers jsonb := '[]'::jsonb;
begin
  if p_user_id is null then
    return jsonb_build_object('ok', false, 'error', 'No user provided');
  end if;

  select * into v_settings from public.reward_settings where id = true;
  if not found or not coalesce(v_settings.stamp_enabled, false) then
    return jsonb_build_object('ok', false, 'reason', 'Stamp rewards are not enabled');
  end if;

  v_threshold := coalesce(nullif(v_settings.stamp_threshold, 0), 8);

  select * into v_account from public.reward_accounts where user_id = p_user_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'No reward account found');
  end if;

  v_rewards := v_account.stamp_count / v_threshold;
  if v_rewards <= 0 then
    return jsonb_build_object(
      'ok', true,
      'claimed', 0,
      'stamp_count', v_account.stamp_count,
      'stamp_threshold', v_threshold
    );
  end if;

  -- Pick preferred template, or active fallback
  v_template_id := v_settings.stamp_reward_template_id;
  if v_template_id is not null then
    select * into v_template from public.voucher_templates where id = v_template_id and active;
  end if;

  if v_template.id is null then
    select * into v_template from public.voucher_templates
    where active
    order by case when title ilike '%drink%' or title ilike '%free%' or title ilike '%kopi%' then 0 else 1 end, coalesce(amount_off_cents, 0) desc, id asc
    limit 1;
  end if;

  -- Safeguard: if no active voucher template exists in system, create one
  if v_template.id is null then
    insert into public.voucher_templates (
      title, description, voucher_type, valid_scope, active
    ) values (
      'Free Signature Drink', 'Enjoy 1 free handcrafted cup on us for filling your stamp card!', 'free_drink', 'any_drink', true
    ) returning * into v_template;

    update public.reward_settings set stamp_reward_template_id = v_template.id where id = true;
  end if;

  -- Create the voucher(s)
  for i in 1..v_rewards loop
    insert into public.user_vouchers(user_id, voucher_template_id, source, status, expires_at)
    values(p_user_id, v_template.id, 'stamp_reward', 'active', v_template.expires_at)
    returning id into v_voucher_id;

    v_new_vouchers := v_new_vouchers || jsonb_build_object(
      'id', v_voucher_id,
      'template_id', v_template.id,
      'title', v_template.title,
      'description', v_template.description,
      'source', 'stamp_reward'
    );
  end loop;

  -- Deduct redeemed stamps
  update public.reward_accounts
  set stamp_count = stamp_count - (v_rewards * v_threshold),
      updated_at = now()
  where user_id = p_user_id;

  insert into public.reward_ledger(user_id, entry_type, stamps_delta, note)
  values(p_user_id, 'stamp_reward', -(v_rewards * v_threshold), 'Claimed ' || v_rewards || ' stamp card reward(s)');

  return jsonb_build_object(
    'ok', true,
    'claimed', v_rewards,
    'vouchers', v_new_vouchers,
    'remaining_stamps', v_account.stamp_count - (v_rewards * v_threshold),
    'stamp_threshold', v_threshold,
    'template_title', v_template.title
  );
end $$;

revoke all on function private.process_customer_stamp_rewards(uuid) from public,anon;
grant execute on function private.process_customer_stamp_rewards(uuid) to authenticated;

-- 3. Public RPC for customer app to trigger stamp claim directly
create or replace function public.claim_stamp_reward()
returns jsonb
language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null then
    raise exception 'Sign-in required to claim stamp rewards';
  end if;
  return private.process_customer_stamp_rewards(auth.uid());
end $$;

revoke all on function public.claim_stamp_reward() from public,anon;
grant execute on function public.claim_stamp_reward() to authenticated;

-- 4. Update order completion rewards trigger to use the automated processor
create or replace function private.award_completed_order_rewards()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_settings public.reward_settings%rowtype;
  v_points integer;
  v_stamps integer;
begin
  if new.status <> 'completed' or old.status = 'completed' or new.user_id is null then return new; end if;
  if coalesce((select is_anonymous from auth.users where id = new.user_id), false) then return new; end if;

  select * into v_settings from public.reward_settings where id = true;
  insert into public.reward_accounts(user_id) values(new.user_id) on conflict(user_id) do nothing;

  if v_settings.points_enabled then
    v_points = floor(new.total_cents::numeric * v_settings.points_per_rm / 100)::integer;
    if v_points > 0 then
      update public.reward_accounts
      set points_balance = points_balance + v_points,
          lifetime_points = lifetime_points + v_points,
          updated_at = now()
      where user_id = new.user_id;
      insert into public.reward_ledger(user_id,order_id,entry_type,points_delta,note)
      values(new.user_id,new.id,'points_earned',v_points,'Points from '||new.order_number)
      on conflict do nothing;
    end if;
  end if;

  if v_settings.stamp_enabled then
    select coalesce(sum(quantity),0)::integer into v_stamps
    from public.order_items where order_id = new.id;
    if v_stamps > 0 then
      update public.reward_accounts
      set stamp_count = stamp_count + v_stamps, updated_at = now()
      where user_id = new.user_id;
      insert into public.reward_ledger(user_id,order_id,entry_type,stamps_delta,note)
      values(new.user_id,new.id,'stamps_earned',v_stamps,'Stamps from '||new.order_number)
      on conflict do nothing;
    end if;
    -- Automatically award voucher if card is full
    perform private.process_customer_stamp_rewards(new.user_id);
  end if;
  return new;
end $$;

-- 5. Update admin reward grant to also process stamps if threshold met
create or replace function private.grant_customer_reward_impl(
  p_customer_id uuid,
  p_reward_type text,
  p_amount integer default null,
  p_voucher_template_id bigint default null,
  p_note text default null
) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
  v_admin uuid := (select auth.uid());
  v_voucher_id bigint;
begin
  if (select private.current_staff_role()) <> 'global_admin' then
    raise exception 'Global administrator access required';
  end if;
  if not exists(select 1 from auth.users u where u.id=p_customer_id) or
     exists(select 1 from public.staff s where s.user_id=p_customer_id) then
    raise exception 'Choose an active customer account';
  end if;

  if p_reward_type='points' then
    if coalesce(p_amount,0) <= 0 or p_amount > 1000000 then raise exception 'Points must be between 1 and 1,000,000'; end if;
    insert into public.reward_accounts(user_id,points_balance,stamp_count,lifetime_points,updated_at)
      values(p_customer_id,p_amount,0,p_amount,now())
      on conflict(user_id) do update set
        points_balance=public.reward_accounts.points_balance+excluded.points_balance,
        lifetime_points=public.reward_accounts.lifetime_points+excluded.lifetime_points,
        updated_at=now();
    insert into public.reward_ledger(user_id,entry_type,points_delta,stamps_delta,note)
      values(p_customer_id,'manual_adjustment',p_amount,0,left(coalesce(p_note,'Admin points grant'),240));
  elsif p_reward_type='stamps' then
    if coalesce(p_amount,0) <= 0 or p_amount > 1000 then raise exception 'Stamps must be between 1 and 1,000'; end if;
    insert into public.reward_accounts(user_id,points_balance,stamp_count,lifetime_points,updated_at)
      values(p_customer_id,0,p_amount,0,now())
      on conflict(user_id) do update set
        stamp_count=public.reward_accounts.stamp_count+excluded.stamp_count,
        updated_at=now();
    insert into public.reward_ledger(user_id,entry_type,points_delta,stamps_delta,note)
      values(p_customer_id,'manual_adjustment',0,p_amount,left(coalesce(p_note,'Admin stamp grant'),240));
    -- Automatically process if threshold reached
    perform private.process_customer_stamp_rewards(p_customer_id);
  elsif p_reward_type='voucher' then
    if not exists(select 1 from public.voucher_templates v where v.id=p_voucher_template_id and v.active) then
      raise exception 'Choose an active voucher';
    end if;
    insert into public.user_vouchers(user_id,voucher_template_id,source,status,expires_at)
      select p_customer_id,v.id,'admin','active',v.expires_at
      from public.voucher_templates v where v.id=p_voucher_template_id
      returning id into v_voucher_id;
  else
    raise exception 'Reward type must be points, stamps, or voucher';
  end if;

  insert into public.admin_audit_logs(admin_id,action_type,target_id,details_json)
    values(v_admin,'customer.reward_granted',p_customer_id::text,
      jsonb_build_object('reward_type',p_reward_type,'amount',p_amount,
        'voucher_template_id',p_voucher_template_id,'voucher_id',v_voucher_id,'note',left(coalesce(p_note,''),240)));
  return jsonb_build_object('ok',true,'voucher_id',v_voucher_id);
end $$;

-- 6. Retroactively process any existing accounts with completed stamp cards
do $$
declare
  r record;
begin
  for r in select user_id from public.reward_accounts loop
    perform private.process_customer_stamp_rewards(r.user_id);
  end loop;
end $$;

notify pgrst, 'reload schema';
