import {useEffect,useRef,useState} from 'react';
import {MapPin,Clock,MagnifyingGlass,CaretDown,Check,X} from '@phosphor-icons/react';
import {brand} from '@coffee/brand';
import type {Store} from './StoreContext';
import {discoverStores,type Position} from './storeDiscovery';
import './store-cards.css';
export function StoreCards({stores,selected,loading,error,choose}:{stores:Store[];selected:Store|null;loading:boolean;error:string;choose:(s:Store)=>void}){
 const [position,setPosition]=useState<Position|null>(null),[query,setQuery]=useState(''),[region,setRegion]=useState('nearby'),[status,setStatus]=useState('Finding stores near you…'),[limit,setLimit]=useState(12);
 const [regionsOpen,setRegionsOpen]=useState(false),[searchOpen,setSearchOpen]=useState(false);
 const rail=useRef<HTMLDivElement>(null),manual=useRef(false);
 useEffect(()=>{
  let active=true;const timer=window.setTimeout(()=>{if(active)setStatus('You can browse stores while location permission is pending.');},9000);
  if(!window.isSecureContext||!navigator.geolocation){setStatus('Browse stores below. Location is unavailable on this connection.');window.clearTimeout(timer);return;}
  navigator.geolocation.getCurrentPosition(p=>{window.clearTimeout(timer);if(!active)return;setPosition({latitude:p.coords.latitude,longitude:p.coords.longitude});if(!manual.current)setRegion('nearby');setStatus('Distances are approximate, not driving distance.');},e=>{window.clearTimeout(timer);if(active)setStatus(e.code===1?'Location not shared. You can still browse every available store.':'Location unavailable. Browse stores or choose a state.');},{timeout:8000,maximumAge:300000,enableHighAccuracy:false});
  return()=>{active=false;window.clearTimeout(timer);};
 },[]);
 const states=[...new Set(stores.filter(s=>s.accepting_pickup&&s.state).map(s=>s.state!))].sort();
 const hasMappedStores=stores.some(s=>s.accepting_pickup&&s.latitude!=null&&s.longitude!=null);
 const results=discoverStores(stores,position,query,region==='nearby'&&!hasMappedStores?'':region);
 useEffect(()=>{setLimit(12);rail.current?.scrollTo({left:0});},[query,region]);
 function filter(value:string){manual.current=true;setRegion(value);setRegionsOpen(false);}
 const hours=(s:Store)=>{if(s.opening_time===s.closing_time)return 'All-day demo pickup';const format=(v:string)=>{const [h,m]=v.split(':').map(Number);return `${h%12||12}:${String(m).padStart(2,'0')} ${h>=12?'pm':'am'}`;};return `${format(s.opening_time)} – ${format(s.closing_time)}`;};
 return <div className="pickup-discovery">
  <h2 id="store-title" className="pickup-sr-only">Choose pickup store</h2>
  <div className="pickup-toolbar"><button className="pickup-region-button" aria-expanded={regionsOpen} aria-controls="pickup-regions" onClick={()=>{setRegionsOpen(!regionsOpen);setSearchOpen(false);}}><img src={brand.logo} alt="Pak Kopi"/><span>{region==='nearby'?'Nearby':region||'All regions'}</span><CaretDown size={18}/></button><button className="pickup-search-toggle" aria-label={searchOpen?'Close search':'Search stores'} aria-expanded={searchOpen} onClick={()=>{setSearchOpen(!searchOpen);setRegionsOpen(false);if(searchOpen)setQuery('');}}>{searchOpen?<X size={23}/>:<MagnifyingGlass size={23}/>}</button></div>
  {searchOpen&&<label className="pickup-search"><input autoFocus aria-label="Search branches, cities or states" placeholder="Search stores" value={query} onChange={e=>setQuery(e.target.value)}/></label>}
  {regionsOpen?<div className="pickup-region-list" id="pickup-regions" role="group" aria-label="Choose region">{[['nearby','Nearby'],['','All regions'],...states.map(s=>[s,s])].map(([value,label])=><button key={value} aria-pressed={region===value} onClick={()=>filter(value)}>{value==='nearby'&&<img src={brand.logo} alt=""/>}<span>{label}</span>{region===value&&<Check size={20}/>}</button>)}</div>:<>
  <span className="pickup-sr-only" role="status">{status}</span>
  {error?<p role="alert">Unable to load stores. Please try again.</p>:loading?<p role="status">Loading stores…</p>:<>
   <div className="pickup-card-rail" ref={rail} onScroll={e=>{const el=e.currentTarget;if(el.scrollWidth-el.scrollLeft-el.clientWidth<100)setLimit(n=>Math.min(n+12,results.length));}}>{results.slice(0,limit).map(({store:s,distance})=><button type="button" className="pickup-store-card" key={s.id} aria-pressed={selected?.id===s.id} onClick={()=>choose(s)}>
    <span className="pickup-store-photo"><img src={s.image_url||brand.storePlaceholder} alt={s.image_url&&!s.image_url.includes('/brand/cafe-')?`${s.name} branch`:'Illustrative café photo'} onError={e=>{e.currentTarget.onerror=null;e.currentTarget.src=brand.storePlaceholder;}}/></span>
    <span className="pickup-store-info"><span className="pickup-card-heading"><strong>{s.name}</strong>{distance!==null&&<span className="pickup-distance" title="Approximate straight-line distance"><MapPin size={15}/>{distance<1?distance.toFixed(1):Math.round(distance)} km</span>}</span><span className="pickup-address">{s.address}</span><span className="pickup-hours"><Clock size={17}/>{hours(s)}</span></span>
   </button>)}</div>
   {!results.length&&<div className="pickup-empty"><p>{region==='nearby'&&!query?'No stores nearby.':'No stores found.'}</p><button onClick={()=>{setQuery('');filter('');}}>View all regions</button></div>}
  </>}
  </>}
 </div>;
}
