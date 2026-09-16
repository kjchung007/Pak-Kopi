-- Demo-only capability is controlled by the server, never a browser flag.
create table private.demo_settings(id boolean primary key default true check(id),enabled boolean not null default false,order_prefix text not null default 'DM');
insert into private.demo_settings(id) values(true);
revoke all on private.demo_settings from public,anon,authenticated;

create function private.validate_demo_cart(p_items jsonb,p_store bigint) returns void
language plpgsql security definer set search_path='' as $$
declare item jsonb; product public.products; chosen_size text; chosen_temp text;
begin
 if not exists(select 1 from private.demo_settings where enabled) then raise exception 'Demo checkout is disabled';end if;
 if auth.uid() is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then raise exception 'Sign in to place a demo order';end if;
 if not exists(select 1 from public.stores where id=p_store and active and accepting_pickup) then raise exception 'Branch is not accepting orders';end if;
 if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) not between 1 and 50 then raise exception 'Cart must contain 1 to 50 items';end if;
 for item in select value from jsonb_array_elements(p_items) loop
  if jsonb_typeof(item->'quantity') is distinct from 'number' or (item->>'quantity') !~ '^[0-9]+$' or (item->>'quantity')::int not between 1 and 20 then raise exception 'Invalid quantity';end if;
  select p.* into product from public.products p join public.store_product_availability a on a.product_id=p.id and a.store_id=p_store and a.available where p.id=(item->>'product_id')::bigint and p.available for share of p,a;
  if not found then raise exception 'An item is unavailable at this branch';end if;
  chosen_size:=case when item->'customization'->>'size'='Large +RM 1.00' then 'Large' else item->'customization'->>'size' end;
  chosen_temp:=item->'customization'->>'temperature';
  if not exists(select 1 from jsonb_array_elements(product.size_options) s where s->>'name'=chosen_size) then raise exception 'Invalid size';end if;
  if chosen_temp is null or not chosen_temp=any(product.temperature_options) then raise exception 'Invalid temperature';end if;
  if coalesce(jsonb_array_length(item->'customization'->'toppings'),0)>0 then raise exception 'Demo toppings are not available';end if;
 end loop;
end $$;
revoke all on function private.validate_demo_cart(jsonb,bigint) from public,anon;
grant execute on function private.validate_demo_cart(jsonb,bigint) to authenticated;

create or replace function public.create_pickup_order(p_customer_name text,p_items jsonb,p_store_id bigint,p_user_voucher_id bigint,p_secret_code text,p_payment_method text)
returns public.orders language plpgsql security invoker set search_path='' as $$
begin
 perform private.validate_demo_cart(p_items,p_store_id);
 return private.create_pickup_order_impl(p_customer_name,p_items,p_store_id,p_user_voucher_id,p_secret_code,p_payment_method);
end $$;
create or replace function public.create_pickup_order(p_customer_name text,p_items jsonb,p_store_id bigint,p_user_voucher_id bigint default null,p_secret_code text default null)
returns public.orders language plpgsql security invoker set search_path='' as $$
begin
 perform private.validate_demo_cart(p_items,p_store_id);
 return private.create_pickup_order_impl(p_customer_name,p_items,p_store_id,p_user_voucher_id,p_secret_code);
end $$;
create or replace function public.create_counter_order(p_store_id bigint,p_customer_name text,p_items jsonb,p_payment_method text)
returns public.orders language plpgsql security invoker set search_path='' as $$
begin
 perform private.validate_demo_cart(p_items,p_store_id);
 return private.create_counter_order_impl(p_store_id,p_customer_name,p_items,p_payment_method);
end $$;

create function private.complete_demo_payment_impl(p_order_id bigint) returns public.orders
language plpgsql security definer set search_path='' as $$
declare result public.orders; calculated integer;
begin
 if auth.uid() is null then raise exception 'Sign in required';end if;
 if not exists(select 1 from private.demo_settings where enabled) then raise exception 'Demo payments are disabled';end if;
 select * into result from public.orders where id=p_order_id and user_id=auth.uid() for update;
 if not found then raise exception 'Order not found';end if;
 if result.status='cancelled' or result.payment_status in ('failed','cancelled','refunded') then raise exception 'Order cannot be paid';end if;
 if result.payment_status='paid' then return result;end if;
 select sum(quantity*unit_price_cents) into calculated from public.order_items where order_id=p_order_id;
 if calculated is null or calculated<>result.subtotal or result.final_total<>calculated-result.discount_amount+result.tax_amount then raise exception 'Invalid order total';end if;
 if exists(select 1 from public.order_items i join public.products p on p.id=i.product_id left join public.store_product_availability a on a.product_id=p.id and a.store_id=result.store_id where i.order_id=p_order_id and (not p.available or not coalesce(a.available,false))) then raise exception 'An item is no longer available';end if;
 update public.orders set payment_status='paid',paid_at=now(),updated_at=now() where id=p_order_id returning * into result;
 return result;
end $$;
revoke all on function private.complete_demo_payment_impl(bigint) from public,anon;
grant execute on function private.complete_demo_payment_impl(bigint) to authenticated;
create function public.complete_demo_payment(p_order_id bigint) returns public.orders language sql security invoker set search_path='' as $$select private.complete_demo_payment_impl(p_order_id)$$;
revoke all on function public.complete_demo_payment(bigint) from public,anon;
grant execute on function public.complete_demo_payment(bigint) to authenticated;

-- Orders may only be created through validated RPCs. Staff can change workflow,
-- but cannot edit prices, identities, branches or payment totals.
revoke insert,update,delete on public.orders from authenticated;
revoke insert,update,delete on public.order_items from authenticated;
grant update(status,payment_status,updated_at) on public.orders to authenticated;
create function private.guard_order_transition() returns trigger language plpgsql set search_path='' as $$
begin
 if current_user='authenticated' then
  if old.status<>new.status and not ((old.status='new' and new.status in ('preparing','cancelled')) or (old.status='preparing' and new.status in ('ready','cancelled')) or (old.status='ready' and new.status in ('completed','cancelled'))) then raise exception 'Invalid order transition';end if;
  if new.status in ('preparing','ready','completed') and old.payment_status<>'paid' then raise exception 'Payment must complete first';end if;
  if new.payment_status<>old.payment_status and not(new.status='cancelled' and new.payment_status='cancelled') then raise exception 'Use the validated payment flow';end if;
 end if;
 return new;
end $$;
create trigger guard_order_transition before update on public.orders for each row execute function private.guard_order_transition();
revoke all on function private.guard_order_transition() from public,anon,authenticated;
-- Private projection is safe to read publicly; only internal triggers write it.
revoke insert,update,delete on public.waiting_board_entries,public.store_queue_metrics from authenticated;

create or replace function private.assign_store_order_number() returns trigger language plpgsql security definer set search_path='' as $$
declare next_value bigint; prefix text;
begin
 insert into private.store_order_sequences(store_id,last_value) values(new.store_id,1) on conflict(store_id) do update set last_value=private.store_order_sequences.last_value+1 returning last_value into next_value;
 select order_prefix into prefix from private.demo_settings where id;
 new.order_number:=format('%s%s-%s',coalesce(prefix,'DM'),new.store_id,lpad(next_value::text,4,'0'));
 return new;
end $$;
notify pgrst,'reload schema';
