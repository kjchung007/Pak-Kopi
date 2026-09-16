import { createClient } from 'npm:@supabase/supabase-js@2.112.3';
export const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS'};
export const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json'}});
export function config(){
 const base=Deno.env.get('HITPAY_API_URL')?.replace(/\/$/,'');
 const key=Deno.env.get('HITPAY_API_KEY'),salt=Deno.env.get('HITPAY_SALT');
 if(base!=='https://api.sandbox.hit-pay.com'||!key||!salt)throw new Error('Sandbox payment configuration is incomplete');
 return {base,key,salt};
}
export function admin(){return createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});}
export async function user(req:Request){
 const token=req.headers.get('authorization')?.replace(/^Bearer /i,'');
 if(!token)throw new Error('Sign in required');
 const {data,error}=await admin().auth.getUser(token);
 if(error||!data.user||data.user.is_anonymous)throw new Error('Sign in required');
 return data.user;
}
export function orderId(value:unknown){if(!Number.isSafeInteger(value)||Number(value)<=0)throw new Error('Invalid order');return Number(value);}
export function returnUrl(origin:unknown,id:number){
 const allowed=(Deno.env.get('HITPAY_ALLOWED_ORIGINS')||'http://localhost:5173,http://127.0.0.1:5173,http://192.168.0.148:5173').split(',').map(x=>x.trim());
 if(typeof origin!=='string'||!allowed.includes(origin))throw new Error('Ordering address is not allowed');
 return `${origin}/?payment=return&order_id=${id}`;
}
export function cents(value:unknown){
 const s=String(value);if(!/^\d+(\.\d{1,2})?$/.test(s))throw new Error('Invalid provider amount');
 const [a,b='']=s.split('.');const n=Number(a)*100+Number(b.padEnd(2,'0'));
 if(!Number.isSafeInteger(n)||n<=0)throw new Error('Invalid provider amount');return n;
}
export function checkoutUrl(value:unknown){
 const url=new URL(String(value));
 if(url.protocol!=='https:'||!url.hostname.endsWith('.sandbox.hit-pay.com')||url.username||url.password)throw new Error('Only sandbox checkout is allowed');
 return url.href;
}
export async function hitpay(path:string,body?:URLSearchParams){
 const {base,key}=config();
 const response=await fetch(base+'/v1/'+path,{method:body?'POST':'GET',redirect:'error',signal:AbortSignal.timeout(20000),headers:{'X-BUSINESS-API-KEY':key,'X-Requested-With':'XMLHttpRequest','Content-Type':'application/x-www-form-urlencoded'},body});
 if(!response.ok){console.error('HitPay sandbox returned',response.status);throw new Error(`HitPay sandbox rejected the request (${response.status}). Check sandbox credentials and enabled payment methods.`);}
 return await response.json();
}
export async function reconcile(id:string,webhook=false){
 if(!/^[a-zA-Z0-9-]{10,80}$/.test(id))throw new Error('Invalid payment reference');
 const payment=await hitpay('payment-requests/'+encodeURIComponent(id));
 if(payment.id!==id)throw new Error('Provider request mismatch');
 const {data,error}=await admin().rpc('verify_hitpay_result',{p_request_id:id,p_reference:payment.reference_number,p_amount_cents:cents(payment.amount),p_currency:payment.currency,p_status:payment.status,p_webhook:webhook});
 if(error)throw new Error(error.message);return data;
}
export async function validSignature(raw:string,signature:string,salt:string){
 if(!/^[a-f0-9]{64}$/i.test(signature))return false;
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(salt),{name:'HMAC',hash:'SHA-256'},false,['verify']);
 const bytes=new Uint8Array(signature.match(/../g)!.map(x=>parseInt(x,16)));
 return crypto.subtle.verify('HMAC',key,bytes,new TextEncoder().encode(raw));
}
