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
 begin perform public.create_pickup_order('Bad','[{"product_id":21,"quantity":1,"customization":{"size":"Regular","temperature":"Iced"}}]',1,null,null,'fpx');raise exception 'TEST expected unavailable';exception when others then if sqlerrm='TEST expected unavailable' then raise;end if;end;
 begin perform public.create_pickup_order('Bad','[{"product_id":1,"quantity":0,"customization":{"size":"Regular","temperature":"Iced"}}]',1,null,null,'fpx');raise exception 'TEST expected quantity error';exception when others then if sqlerrm='TEST expected quantity error' then raise;end if;end;
 begin perform public.create_pickup_order('Bad','[{"product_id":1,"quantity":1,"customization":{"size":"Free","temperature":"Iced"}}]',1,null,null,'fpx');raise exception 'TEST expected modifier error';exception when others then if sqlerrm='TEST expected modifier error' then raise;end if;end;
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
reset role;
select set_config('request.jwt.claim.sub','',false);
