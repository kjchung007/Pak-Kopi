import {useEffect,useRef,useState} from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {normalizeState,malaysiaStates} from '@coffee/brand/regions';
import './store-location.css';
type Place={lat:string;lon:string;display_name:string;address?:{state?:string;city?:string;town?:string}};
export function StoreLocationPicker({latitude,longitude,mapsUrl,address,onChange}:{latitude?:number|null;longitude?:number|null;mapsUrl?:string;address:string;onChange:(value:{latitude:number|null;longitude:number|null;state?:string;city?:string})=>void}){
 const node=useRef<HTMLDivElement>(null),map=useRef<L.Map|null>(null),pin=useRef<L.Marker|null>(null),callback=useRef(onChange);
 const [search,setSearch]=useState(address),[places,setPlaces]=useState<Place[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [mapsLink,setMapsLink]=useState(mapsUrl||'');
 const controller=useRef<AbortController|null>(null);callback.current=onChange;
 const valid=latitude!=null&&longitude!=null&&Number.isFinite(latitude)&&Number.isFinite(longitude)&&Math.abs(latitude)<=90&&Math.abs(longitude)<=180;
 useEffect(()=>{
  if(!node.current)return;
  const m=L.map(node.current,{scrollWheelZoom:false}).setView(valid?[latitude!,longitude!]:[4.4,109],valid?16:5);map.current=m;
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(m);
  m.on('click',(e:L.LeafletMouseEvent)=>callback.current({latitude:Number(e.latlng.lat.toFixed(7)),longitude:Number(e.latlng.lng.toFixed(7))}));
  const observer=new ResizeObserver(()=>m.invalidateSize());observer.observe(node.current);
  return()=>{controller.current?.abort();observer.disconnect();m.remove();map.current=null;pin.current=null};
 },[]);
 useEffect(()=>{
  const m=map.current;if(!m)return;
  if(!valid){pin.current?.remove();pin.current=null;return}
  const coords:L.LatLngTuple=[latitude!,longitude!];
  if(!pin.current){pin.current=L.marker(coords,{draggable:true,title:'Store location',icon:L.divIcon({className:'store-location-pin',html:'<span></span>',iconSize:[26,34],iconAnchor:[13,34]})}).addTo(m);
   pin.current.on('dragend',()=>{const p=pin.current!.getLatLng();callback.current({latitude:Number(p.lat.toFixed(7)),longitude:Number(p.lng.toFixed(7))})});
  }else pin.current.setLatLng(coords);
  m.setView(coords,Math.max(m.getZoom(),15),{animate:false});
 },[latitude,longitude,valid]);
 async function find(term=search){
  if(term.trim().length<3||busy)return;controller.current?.abort();const c=new AbortController();controller.current=c;setBusy(true);setError('');setPlaces([]);
  const timeout=setTimeout(()=>c.abort(),12000);
  try{const response=await fetch('https://nominatim.openstreetmap.org/search?'+new URLSearchParams({q:search.trim(),format:'jsonv2',countrycodes:'my',limit:'5',addressdetails:'1'}),{signal:c.signal});if(!response.ok)throw new Error();const data:Place[]=await response.json();setPlaces(data);if(!data.length)setError('No match. Try the street or place a pin on the map.');}
  catch{if(map.current)setError('Search unavailable. You can still place a pin or enter coordinates.');}finally{clearTimeout(timeout);if(map.current)setBusy(false)}
 }
 function choose(p:Place){const state=normalizeState(p.address?.state);onChange({latitude:Number(p.lat),longitude:Number(p.lon),...(malaysiaStates.includes(state)?{state}:{}),...(p.address?.city||p.address?.town?{city:p.address.city||p.address.town}: {})});setPlaces([]);setSearch(p.display_name)}
 function extractCoordinates(value:string){const match=value.match(/@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/)||value.match(/[?&](?:query|q|ll)=(-?\d+(?:\.\d+)?)[,%20]+(-?\d+(?:\.\d+)?)/i);if(!match)return false;const lat=Number(match[1]),lon=Number(match[2]);if(Math.abs(lat)>90||Math.abs(lon)>180)return false;onChange({latitude:Number(lat.toFixed(7)),longitude:Number(lon.toFixed(7))});setError('');return true}
 async function useMapsLink(value:string){setMapsLink(value);if(!value.trim())return;if(extractCoordinates(value))return;setError('Resolving Google Maps link…');try{const response=await fetch(value,{redirect:'follow'});if(response.url&&extractCoordinates(response.url))return;}catch{/* Some Google links block browser resolution; address search remains available. */}setError('This link hides its coordinates. We will use the branch address to locate it automatically when saved.')}
 return <div className="store-location"><label>Find on map<div className="store-location-search"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Branch, street or postcode" onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();void find()}}}/><button type="button" onClick={()=>void find()} disabled={busy||search.trim().length<3}>{busy?'Finding…':'Search'}</button></div></label><label className="store-location-link">Google Maps link<input type="url" value={mapsLink} onChange={e=>useMapsLink(e.target.value)} placeholder="Paste a Google Maps link"/><small>Coordinates fill automatically when available.</small></label>
  {error&&<p role="status">{error}</p>}{places.length>0&&<ul className="store-location-results">{places.map((p,i)=><li key={i}><button type="button" onClick={()=>choose(p)}>{p.display_name}</button></li>)}</ul>}
  <div ref={node} className="store-location-map" aria-label="Store location map. Use arrow keys to pan, then choose Use map centre."/>
  <div className="store-location-caption"><small>Location is filled from the link or branch address.</small></div>
  <details><summary>Coordinates</summary><div className="pair"><label>Latitude<input type="number" step="any" min="-90" max="90" value={latitude??''} onChange={e=>onChange({latitude:e.target.value===''?null:Number(e.target.value),longitude:longitude??null})}/></label><label>Longitude<input type="number" step="any" min="-180" max="180" value={longitude??''} onChange={e=>onChange({longitude:e.target.value===''?null:Number(e.target.value),latitude:latitude??null})}/></label></div><button type="button" onClick={()=>onChange({latitude:null,longitude:null})}>Clear pin</button></details>
 </div>;
}

