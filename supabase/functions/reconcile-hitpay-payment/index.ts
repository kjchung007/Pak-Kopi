import {admin,cors,reply,user,orderId,reconcile} from '../_shared/hitpay.ts';
Deno.serve(async(req)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
 if(req.method!=='POST')return reply({error:'Method not allowed'},405);
 try{
  const caller=await user(req);const body=await req.json();const id=orderId(body.order_id);
  const {data:o,error}=await admin().from('orders').select('hitpay_payment_request_id,payment_status').eq('id',id).eq('user_id',caller.id).maybeSingle();
  if(error||!o)return reply({error:'Order not found'},404);
  if(!o.hitpay_payment_request_id)return reply({payment_status:o.payment_status});
  return reply(await reconcile(o.hitpay_payment_request_id));
 }catch(e){return reply({error:e instanceof Error?e.message:'Payment verification unavailable'},400);}
});
