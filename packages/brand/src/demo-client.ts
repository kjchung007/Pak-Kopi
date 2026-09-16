import type { SupabaseClient } from '@supabase/supabase-js';
/** Local presentations poll the same RLS-protected queries. Hosted deployments
 * retain Supabase Realtime unchanged. No data or authorization lives here. */
export function configureDemoUpdates(client:SupabaseClient,local:boolean):SupabaseClient {
 if(!local)return client;
 const timers=new Map<object,ReturnType<typeof setInterval>>();
 client.channel=((_name:string)=>{
  type Row=Record<string,unknown>;
  const callbacks:Array<{filter:{table:string;event?:string;filter?:string};callback:(payload:unknown)=>void;previous:Map<string,Row>|null}>=[];
  let busy=false,stopped=false;
  async function poll(){if(busy||stopped)return;busy=true;try{for(const listener of callbacks){
   let query=client.from(listener.filter.table).select('*');
   const match=listener.filter.filter?.match(/^([\w]+)=eq\.(.+)$/);if(match)query=query.eq(match[1],match[2]);
   const {data,error}=await query;if(error||!data||stopped)continue;
   const next=new Map<string,Row>(data.map((row:Row)=>[JSON.stringify(row.id??row.order_id??row.user_id??row.store_id??row),row]));
   const emit=(eventType:string,row:Row,old:Row)=>{if(!listener.filter.event||listener.filter.event==='*'||listener.filter.event===eventType)listener.callback({eventType,new:row,old})};
   if(listener.previous){for(const [key,row]of next){const old=listener.previous.get(key);if(!old)emit('INSERT',row,{});else if(JSON.stringify(old)!==JSON.stringify(row))emit('UPDATE',row,old)}for(const [key,old]of listener.previous)if(!next.has(key))emit('DELETE',{},old)}
   listener.previous=next;
  }}finally{busy=false}}
  const channel={
   on:(_type:string,filter:{table:string;event?:string;filter?:string},callback:(payload:unknown)=>void)=>{callbacks.push({filter,callback,previous:null});return channel},
   subscribe:(callback?:(state:string)=>void)=>{callback?.('SUBSCRIBED');void poll();timers.set(channel,setInterval(()=>void poll(),1500));return channel},
   unsubscribe:async()=>{stopped=true;clearInterval(timers.get(channel));timers.delete(channel);return 'ok'},
  };
  return channel;
 }) as SupabaseClient['channel'];
 client.removeChannel=(async(channel:object)=>{clearInterval(timers.get(channel));timers.delete(channel);return 'ok'}) as SupabaseClient['removeChannel'];
 return client;
}
