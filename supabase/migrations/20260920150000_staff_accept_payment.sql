-- Allow store staff to accept/verify payment and advance order to preparing.
-- This accommodates customer payment method changes at counter (e.g. network issues during online payment -> switched to cash)
-- as well as manual staff verification of payment.

create or replace function private.staff_accept_order_payment_impl(
  p_order_id bigint,
  p_payment_method text,
  p_start_preparing boolean default true
) returns public.orders
language plpgsql security definer set search_path='' as $$
declare
  v_user uuid := (select auth.uid());
  v_order public.orders;
  v_method text := lower(trim(coalesce(p_payment_method, 'cash')));
begin
  if v_user is null then
    raise exception 'Staff sign-in required';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Order not found';
  end if;

  if not private.can_manage_store(v_order.store_id) then
    raise exception 'You do not have permission to manage orders for this store';
  end if;

  if v_order.status = 'cancelled' then
    raise exception 'Cannot accept payment for a cancelled order';
  end if;

  if v_method not in ('cash','card','fpx','touch_n_go','other','verified') then
    raise exception 'Invalid payment method';
  end if;

  update public.orders
  set payment_status = 'paid',
      payment_method = v_method,
      paid_at = coalesce(paid_at, now()),
      status = case when p_start_preparing and status = 'new' then 'preparing' else status end,
      updated_at = now()
  where id = p_order_id
  returning * into v_order;

  return v_order;
end $$;

revoke all on function private.staff_accept_order_payment_impl(bigint,text,boolean) from public,anon,authenticated;
grant execute on function private.staff_accept_order_payment_impl(bigint,text,boolean) to authenticated;

create or replace function public.staff_accept_order_payment(
  p_order_id bigint,
  p_payment_method text,
  p_start_preparing boolean default true
) returns public.orders
language plpgsql security invoker set search_path='' as $$
begin
  return private.staff_accept_order_payment_impl(p_order_id, p_payment_method, p_start_preparing);
end $$;

revoke all on function public.staff_accept_order_payment(bigint,text,boolean) from public,anon;
grant execute on function public.staff_accept_order_payment(bigint,text,boolean) to authenticated;

notify pgrst, 'reload schema';
