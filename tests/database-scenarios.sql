insert into auth.users(id,email,email_confirmed_at) values
('10000000-0000-0000-0000-000000000001','customer@example.test',now()),
('10000000-0000-0000-0000-000000000002','other@example.test',now()),
('20000000-0000-0000-0000-000000000001','sadong@example.test',now()),
('20000000-0000-0000-0000-000000000002','damai@example.test',now());
insert into public.staff(user_id,role,store_id) values('20000000-0000-0000-0000-000000000001','staff',1),('20000000-0000-0000-0000-000000000002','staff',2);
set role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',false);
do $$declare result public.orders;begin
 select * into result from public.create_pickup_order('Demo customer','[{"product_id":1,"quantity":2,"customization":{"size":"Regular","temperature":"Iced"}}]',1,null,null,'fpx');
 if result.total_cents<>1440 or result.payment_status<>'pending' then raise exception 'Wrong authoritative total or payment state';end if;
 perform public.complete_demo_payment(result.id);
 perform public.complete_demo_payment(result.id);
 if (select count(*) from public.orders)<>1 then raise exception 'Payment retry duplicated order';end if;
 begin perform public.create_pickup_order('Bad','[{"product_id":999,"quantity":1,"customization":{"size":"Regular","temperature":"Iced"}}]',1,null,null,'fpx');raise exception 'TEST expected unavailable';exception when others then if sqlerrm='TEST expected unavailable' then raise;end if;end;
 begin perform public.create_pickup_order('Bad','[{"product_id":1,"quantity":0,"customization":{"size":"Regular","temperature":"Iced"}}]',1,null,null,'fpx');raise exception 'TEST expected quantity error';exception when others then if sqlerrm='TEST expected quantity error' then raise;end if;end;
 begin perform public.create_pickup_order('Bad','[{"product_id":1,"quantity":1,"customization":{"size":"Free","temperature":"Iced"}}]',1,null,null,'fpx');raise exception 'TEST expected modifier error';exception when others then if sqlerrm='TEST expected modifier error' then raise;end if;end;
end$$;
-- Verify staff accepting payment when customer changes to cash at counter
select set_config('request.jwt.claim.sub','20000000-0000-0000-0000-000000000001',false);
do $$declare o public.orders; begin
 select * into o from public.create_pickup_order('Unpaid customer','[{"product_id":1,"quantity":1,"customization":{"size":"Regular","temperature":"Iced"}}]',1,null,null,'fpx');
 if o.payment_status<>'pending' then raise exception 'Order should be pending';end if;
 select * into o from public.staff_accept_order_payment(o.id, 'cash', true);
 if o.payment_status<>'paid' or o.payment_method<>'cash' or o.status<>'preparing' then raise exception 'staff_accept_order_payment cash failed'; end if;

 -- Test card payment acceptance
 select * into o from public.create_pickup_order('Card customer','[{"product_id":1,"quantity":1,"customization":{"size":"Regular","temperature":"Iced"}}]',1,null,null,'touch_n_go');
 select * into o from public.staff_accept_order_payment(o.id, 'card', true);
 if o.payment_status<>'paid' or o.payment_method<>'card' or o.status<>'preparing' then raise exception 'staff_accept_order_payment card failed'; end if;

 -- Test verified online payment acceptance (preserves touch_n_go)
 select * into o from public.create_pickup_order('Verified customer','[{"product_id":1,"quantity":1,"customization":{"size":"Regular","temperature":"Iced"}}]',1,null,null,'touch_n_go');
 select * into o from public.staff_accept_order_payment(o.id, 'verified', true);
 if o.payment_status<>'paid' or o.payment_method<>'touch_n_go' or o.status<>'preparing' then raise exception 'staff_accept_order_payment verified failed'; end if;

 -- Test fallback for unrecognized strings
 select * into o from public.create_pickup_order('Other customer','[{"product_id":1,"quantity":1,"customization":{"size":"Regular","temperature":"Iced"}}]',1,null,null,'fpx');
 select * into o from public.staff_accept_order_payment(o.id, 'some_unknown_gateway', true);
 if o.payment_status<>'paid' or o.payment_method<>'other' or o.status<>'preparing' then raise exception 'staff_accept_order_payment unknown fallback failed'; end if;
end$$;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000002',false);
do $$begin
 if exists(select 1 from public.orders) then raise exception 'Customer isolation failed';end if;
 begin perform public.complete_demo_payment(1);raise exception 'TEST expected ownership error';exception when others then if sqlerrm='TEST expected ownership error' then raise;end if;end;
end$$;
select set_config('request.jwt.claim.sub','20000000-0000-0000-0000-000000000002',false);
do $$begin
 if exists(select 1 from public.orders) then raise exception 'Staff branch isolation failed';end if;
 begin perform public.create_counter_order(1,'Bad','[{"product_id":1,"quantity":1,"customization":{"size":"Regular","temperature":"Iced"}}]','cash');raise exception 'TEST expected staff branch error';exception when others then if sqlerrm='TEST expected staff branch error' then raise;end if;end;
end$$;
select set_config('request.jwt.claim.sub','20000000-0000-0000-0000-000000000001',false);
update public.orders set status='preparing' where id=1;
do $$begin if not exists(select 1 from public.waiting_board_entries where order_id=1 and store_id=1 and status='preparing') then raise exception 'Preparing board failed';end if;end$$;
update public.orders set status='ready' where id=1;
do $$begin if not exists(select 1 from public.waiting_board_entries where order_id=1 and status='ready') then raise exception 'Ready board failed';end if;end$$;
update public.orders set status='completed' where id=1;
do $$begin
  if exists(select 1 from public.waiting_board_entries where order_id=1) then raise exception 'Collected order remained on board';end if;
  begin update public.orders set total_cents=1 where id=1;raise exception 'TEST expected price protection';exception when insufficient_privilege then null;end;
end$$;

-- Reset role to admin to configure reward_settings
reset role;
update public.reward_settings set stamp_enabled = true, stamp_threshold = 8 where id = true;
update public.reward_accounts set stamp_count = 8 where user_id = '10000000-0000-0000-0000-000000000001';

-- Switch to customer and claim stamp reward
set role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',false);
do $$
declare
  res jsonb;
begin
  select public.claim_stamp_reward() into res;
  if (res->>'ok')::boolean is not true or (res->>'claimed')::integer <> 1 then
    raise exception 'claim_stamp_reward failed: %', res;
  end if;
  if not exists(
    select 1 from public.user_vouchers
    where user_id = '10000000-0000-0000-0000-000000000001' and source = 'stamp_reward'
  ) then
    raise exception 'Stamp reward voucher not found in user_vouchers';
  end if;
  if (select stamp_count from public.reward_accounts where user_id = '10000000-0000-0000-0000-000000000001') <> 0 then
    raise exception 'Stamps were not deducted';
  end if;
end $$;

reset role;
select set_config('request.jwt.claim.sub','',false);
