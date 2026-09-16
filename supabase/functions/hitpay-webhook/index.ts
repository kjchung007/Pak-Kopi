import {admin,config,reply,reconcile,validSignature} from '../_shared/hitpay.ts';
Deno.serve(async(req)=>{
 if(req.method!=='POST')return reply({error:'Method not allowed'},405);
 try{
  const raw=await req.text();if(raw.length>100000)return reply({error:'Payload too large'},413);
  if(!await validSignature(raw,req.headers.get('hitpay-signature')||'',config().salt))return reply({error:'Invalid signature'},401);
  if(req.headers.get('hitpay-event-object')!=='payment_request')return reply({ignored:true});
  const payload=JSON.parse(raw);
  const {data:o,error}=await admin().from('orders').select('id').eq('hitpay_payment_request_id',payload.id).maybeSingle();
  if(error)throw new Error('Order lookup unavailable');
  if(!o){
   if(String(payload.reference_number).startsWith('pak-kopi-'))return reply({error:'Checkout is still being attached'},503);
   return reply({ignored:true});
  }
  return reply(await reconcile(payload.id,true));
 }catch{console.error('HitPay sandbox webhook processing failed');return reply({error:'Webhook verification could not complete'},503);}
});
