import {admin,config,cors,reply,user,orderId,returnUrl,hitpay,cents,checkoutUrl} from '../_shared/hitpay.ts';
Deno.serve(async(req)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
 if(req.method!=='POST')return reply({error:'Method not allowed'},405);
 try{
  config();const caller=await user(req);const body=await req.json();const id=orderId(body.order_id);
  const redirect=returnUrl(body.origin,id);
  const db=admin();const {data:a,error}=await db.rpc('claim_hitpay_checkout',{p_order_id:id,p_user_id:caller.id});
  if(error)return reply({error:error.message},409);
  if(a.existing)return reply({checkout_url:checkoutUrl(a.checkout_url),payment_request_id:a.request_id});
  const payload=new URLSearchParams({amount:(a.amount_cents/100).toFixed(2),currency:a.currency,name:a.name||'Pak Kopi customer',email:a.email||caller.email||'',reference_number:a.reference,purpose:`Pak Kopi sandbox order ${id}`,redirect_url:redirect,allow_repeated_payments:'false','payment_methods[]':'card'});
  const payment=await hitpay('payment-requests',payload);
  if(cents(payment.amount)!==a.amount_cents||payment.currency.toUpperCase()!==a.currency||payment.reference_number!==a.reference)throw new Error('Provider amount or reference mismatch');
  const url=checkoutUrl(payment.url);
  const saved=await db.rpc('bind_hitpay_checkout',{p_order_id:id,p_token:a.token,p_request_id:payment.id,p_url:url});
  if(saved.error)throw new Error('Checkout needs review before retrying');
  return reply({checkout_url:url,payment_request_id:payment.id});
 }catch(e){return reply({error:e instanceof Error?e.message:'Sandbox checkout unavailable'},400);}
});
