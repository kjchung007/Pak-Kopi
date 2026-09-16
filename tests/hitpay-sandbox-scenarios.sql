update private.demo_settings set payment_mode='hitpay_sandbox';
set role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',false);
select set_config('request.jwt.claims','{"role":"authenticated"}',false);
select public.create_pickup_order('Sandbox test','[{"product_id":1,"quantity":1,"customization":{"size":"Regular","temperature":"Iced"}}]',1,null,null,'card');
do $$declare v_id bigint;begin
 select max(o.id) into v_id from public.orders o;
 begin perform public.complete_demo_payment(v_id);raise exception 'TEST simulation bypass';exception when others then if sqlerrm='TEST simulation bypass' then raise;end if;end;
 begin perform public.verify_hitpay_result('fake','fake',720,'MYR','completed',false);raise exception 'TEST public settlement';exception when insufficient_privilege then null;end;
end$$;
reset role;
select set_config('request.jwt.claims','{"role":"service_role"}',false);
do $$declare v_id bigint;a jsonb;r jsonb;paid timestamptz;begin
 select max(o.id) into v_id from public.orders o;
 begin perform public.claim_hitpay_checkout(v_id,'10000000-0000-0000-0000-000000000002');raise exception 'TEST ownership';exception when others then if sqlerrm='TEST ownership' then raise;end if;end;
 a:=public.claim_hitpay_checkout(v_id,'10000000-0000-0000-0000-000000000001');
 begin perform public.claim_hitpay_checkout(v_id,'10000000-0000-0000-0000-000000000001');raise exception 'TEST duplicate creating';exception when others then if sqlerrm='TEST duplicate creating' then raise;end if;end;
 begin perform public.bind_hitpay_checkout(v_id,(a->>'token')::uuid,'sandbox-request-123','https://checkout.hit-pay.com/live');raise exception 'TEST production';exception when others then if sqlerrm='TEST production' then raise;end if;end;
 perform public.bind_hitpay_checkout(v_id,(a->>'token')::uuid,'sandbox-request-123','https://checkout.sandbox.hit-pay.com/test');
 r:=public.claim_hitpay_checkout(v_id,'10000000-0000-0000-0000-000000000001');
 if not (r->>'existing')::boolean then raise exception 'Checkout was not reused';end if;
 begin perform public.verify_hitpay_result('sandbox-request-123',a->>'reference',1,'MYR','completed',true);raise exception 'TEST wrong amount';exception when others then if sqlerrm='TEST wrong amount' then raise;end if;end;
 begin perform public.verify_hitpay_result('sandbox-request-123',a->>'reference',720,'SGD','completed',true);raise exception 'TEST wrong currency';exception when others then if sqlerrm='TEST wrong currency' then raise;end if;end;
 begin perform public.verify_hitpay_result('sandbox-request-123','wrong',720,'MYR','completed',true);raise exception 'TEST wrong reference';exception when others then if sqlerrm='TEST wrong reference' then raise;end if;end;
 r:=public.verify_hitpay_result('sandbox-request-123',a->>'reference',720,'MYR','failed',true);
 if r->>'payment_status'<>'failed' then raise exception 'Failed state missing';end if;
 r:=public.verify_hitpay_result('sandbox-request-123',a->>'reference',720,'MYR','completed',true);
 if r->>'payment_status'<>'paid' then raise exception 'Verified success missing';end if;
 select paid_at into paid from public.orders where orders.id=v_id;
 perform public.verify_hitpay_result('sandbox-request-123',a->>'reference',720,'MYR','completed',true);
 perform public.verify_hitpay_result('sandbox-request-123',a->>'reference',720,'MYR','failed',true);
 if (select payment_status from public.orders where orders.id=v_id)<>'paid' or (select paid_at from public.orders where orders.id=v_id)<>paid then raise exception 'Replay changed payment';end if;
end$$;

