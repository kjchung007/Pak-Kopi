import type {Store} from './StoreContext';
export type Position={latitude:number;longitude:number};
export function distanceKm(position:Position,store:Store){
 if(store.latitude==null||store.longitude==null)return null;
 const rad=(n:number)=>n*Math.PI/180;
 const a=Math.sin(rad(store.latitude-position.latitude)/2)**2+Math.cos(rad(position.latitude))*Math.cos(rad(store.latitude))*Math.sin(rad(store.longitude-position.longitude)/2)**2;
 return 6371*2*Math.atan2(Math.sqrt(a),Math.sqrt(Math.max(0,1-a)));
}
export function discoverStores(stores:Store[],position:Position|null,query:string,region:string){
 const words=query.trim().toLowerCase().split(/\s+/).filter(Boolean);
 let list=stores.filter(s=>s.accepting_pickup).map(store=>({store,distance:position?distanceKm(position,store):null}));
 if(words.length)return list.filter(({store:s})=>words.every(w=>`${s.name} ${s.address} ${s.state||''} ${s.city||''}`.toLowerCase().includes(w))).sort((a,b)=>(a.distance??Infinity)-(b.distance??Infinity));
 if(region&&region!=='nearby')list=list.filter(({store:s})=>s.state===region);
 if(position&&region==='nearby')list=list.filter(s=>s.distance!==null&&s.distance<=30);
 return list.sort((a,b)=>(a.distance??Infinity)-(b.distance??Infinity));
}
