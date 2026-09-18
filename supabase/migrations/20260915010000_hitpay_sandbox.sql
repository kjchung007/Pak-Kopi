-- Sandbox activation is explicit and independent of frontend branding.
alter table private.demo_settings add column payment_mode text not null default 'simulated'
 check (payment_mode in ('simulated','hitpay_sandbox'));
create table private.hitpay_attempts(
 order_id bigint primary key references public.orders(id),
 token uuid not null default gen_random_uuid(),
 reference text not null unique,
 amount_cents integer not null check(amount_cents>0),
 currency text not null default 'MYR' check(currency='MYR'),
 request_id text unique,
 checkout_url text,
 state text not null default 'creating' check(state in ('creating','ready','uncertain')),
 created_at timestamptz not null default now(),
 verified_at timestamptz,
 webhook_at timestamptz
);
revoke all on private.hitpay_attempts from public,anon,authenticated;

create or replace function private.create_pickup_order_impl(p_customer_name text,p_items jsonb,p_store_id bigint,p_user_voucher_id bigint,p_secret_code text,p_payment_method text)
returns public.orders language plpgsql security definer set search_path='' as $$
declare v_user uuid:=(select auth.uid()); result public.orders;
begin
 if v_user is null or coalesce(((select auth.jwt())->>'is_anonymous')::boolean,false) then raise exception 'Sign in required';end if;
 if p_payment_method not in ('fpx','touch_n_go','card') then raise exception 'Invalid payment method';end if;
 result:=private.create_pickup_order_impl(p_customer_name,p_items,p_store_id,p_user_voucher_id,p_secret_code);
 update public.orders set payment_method=p_payment_method,payment_status='pending' where id=result.id and user_id=v_user returning * into result;
 return result;
end $$;

-- Prevent calling the old simulated completion to bypass HitPay verification.
create or replace function public.complete_demo_payment(p_order_id bigint) returns public.orders
language plpgsql security invoker set search_path='' as $$
begin return private.complete_demo_payment_impl(p_order_id);end $$;
-- Guard the private implementation too: it is historically executable by authenticated.
do $$declare source text;begin
 source:=pg_get_functiondef('private.complete_demo_payment_impl(bigint)'::regprocedure);
 source:=replace(source,'if auth.uid() is null then', E'if exists(select 1 from private.demo_settings where payment_mode=''hitpay_sandbox'') then raise exception ''Use HitPay sandbox checkout'';end if;\n if auth.uid() is null then');
 execute source;
end $$;
create or replace function public.create_pickup_order(p_customer_name text,p_items jsonb,p_store_id bigint,p_user_voucher_id bigint default null,p_secret_code text default null)
returns public.orders language plpgsql security invoker set search_path='' as $$
begin
 perform private.validate_demo_cart(p_items,p_store_id);
 -- Route all online orders through a pending-payment implementation.
 return private.create_pickup_order_impl(p_customer_name,p_items,p_store_id,p_user_voucher_id,p_secret_code,'card');
end $$;

create function public.claim_hitpay_checkout(p_order_id bigint,p_user_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare o public.orders;a private.hitpay_attempts; total integer;
begin
 if coalesce(auth.jwt()->>'role','')<>'service_role' then raise exception 'Server access required';end if;
 if not exists(select 1 from private.demo_settings where enabled and payment_mode='hitpay_sandbox') then raise exception 'HitPay sandbox is disabled';end if;
 select * into o from public.orders where id=p_order_id and user_id=p_user_id for update;
 if not found then raise exception 'Order not found';end if;
 if o.status<>'new' or o.payment_status<>'pending' then raise exception 'Order is not awaiting payment';end if;
 select * into a from private.hitpay_attempts where order_id=o.id;
 if found then
  if a.state='ready' then return to_jsonb(a)||jsonb_build_object('existing',true);end if;
  raise exception 'A payment request is already being created or needs review. Please check Orders before trying again.';
 end if;
 select sum(quantity*unit_price_cents) into total from public.order_items where order_id=o.id;
 if total is null or total<>o.subtotal or o.final_total<>total-o.discount_amount+o.tax_amount or o.final_total<=0 then raise exception 'Invalid order amount';end if;
 if not exists(select 1 from public.stores where id=o.store_id and active and accepting_pickup) then raise exception 'Branch is not accepting orders';end if;
 if exists(select 1 from public.order_items i left join public.products p on p.id=i.product_id left join public.store_product_availability s on s.product_id=p.id and s.store_id=o.store_id where i.order_id=o.id and (p.id is null or not p.available or not coalesce(s.available,false))) then raise exception 'An item is no longer available';end if;
 insert into private.hitpay_attempts(order_id,reference,amount_cents) values(o.id,'pak-kopi-'||o.id||'-'||gen_random_uuid(),o.final_total) returning * into a;
 return to_jsonb(a)||jsonb_build_object('existing',false,'name',o.customer_name,'email',o.customer_email);
end $$;

create function public.bind_hitpay_checkout(p_order_id bigint,p_token uuid,p_request_id text,p_url text) returns void
language plpgsql security definer set search_path='' as $$
begin
 if coalesce(auth.jwt()->>'role','')<>'service_role' then raise exception 'Server access required';end if;
 if p_url !~ '^https://[a-z0-9.-]+\.sandbox\.hit-pay\.com/' then raise exception 'Sandbox checkout URL required';end if;
 update private.hitpay_attempts set request_id=p_request_id,checkout_url=p_url,state='ready' where order_id=p_order_id and token=p_token and request_id is null;
 if not found then raise exception 'Payment request could not be attached';end if;
 update public.orders set hitpay_payment_request_id=p_request_id,hitpay_checkout_url=p_url,payment_initiated_at=now() where id=p_order_id;
end $$;

create function public.verify_hitpay_result(p_request_id text,p_reference text,p_amount_cents integer,p_currency text,p_status text,p_webhook boolean default false) returns jsonb
language plpgsql security definer set search_path='' as $$
declare a private.hitpay_attempts;o public.orders;
begin
 if coalesce(auth.jwt()->>'role','')<>'service_role' then raise exception 'Server access required';end if;
 select * into a from private.hitpay_attempts where request_id=p_request_id;
 if not found then return jsonb_build_object('ignored',true);end if;
 select * into o from public.orders where id=a.order_id for update;
 if a.reference<>p_reference or a.amount_cents<>p_amount_cents or a.currency<>upper(p_currency) or o.final_total<>a.amount_cents then raise exception 'Payment amount or reference mismatch';end if;
 update private.hitpay_attempts set verified_at=now(),webhook_at=case when p_webhook then now() else webhook_at end where order_id=o.id;
 if p_status='completed' and o.payment_status in ('pending','failed') and o.status='new' then
  update public.orders set payment_status='paid',paid_at=now(),updated_at=now() where id=o.id returning * into o;
 elsif p_status in ('failed','expired','cancelled','canceled') and o.payment_status='pending' then
  update public.orders set payment_status=case when p_status='failed' then 'failed' else 'cancelled' end,updated_at=now() where id=o.id returning * into o;
 end if;
 return jsonb_build_object('order_id',o.id,'payment_status',o.payment_status,'needs_review',p_status='completed' and o.payment_status<>'paid');
end $$;
revoke all on function public.claim_hitpay_checkout(bigint,uuid),public.bind_hitpay_checkout(bigint,uuid,text,text),public.verify_hitpay_result(text,text,integer,text,text,boolean) from public,anon,authenticated;
grant execute on function public.claim_hitpay_checkout(bigint,uuid),public.bind_hitpay_checkout(bigint,uuid,text,text),public.verify_hitpay_result(text,text,integer,text,text,boolean) to service_role;
notify pgrst,'reload schema';
