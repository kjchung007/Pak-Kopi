'use client';
import {useEffect,useRef,useState} from 'react';
import {MagnifyingGlass,ArrowUpRight,CaretLeft,CaretRight,Clock} from '@phosphor-icons/react';
import {brand} from '@coffee/brand';
import {malaysiaStates,normalizeState} from '@coffee/brand/regions';
import {useEditingPreview} from '@/components/useEditingPreview';
import type {SiteDocument,WebsiteStore} from '@coffee/brand/website';
import {MalaysiaMap} from './MalaysiaMap';
import './stores.css';
export function StoresView({initial,editing}:{initial:SiteDocument;editing:boolean;orderUrl:string}){
 const site=useEditingPreview(initial,editing),stores=site.stores||[];
 const [state,setState]=useState('Sabah'),[query,setQuery]=useState(''),[page,setPage]=useState(1);
 const hero=useRef<HTMLElement>(null),copy=useRef<HTMLDivElement>(null),finder=useRef<HTMLElement>(null),resultsRef=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');let frame=0;
  const update=()=>{frame=0;if(!hero.current||!copy.current||!finder.current)return;const progress=Math.max(0,Math.min(1,-hero.current.getBoundingClientRect().top/hero.current.offsetHeight));
   copy.current.style.transform=reduced.matches?'none':`translateY(${-progress*90}px)`;copy.current.style.opacity=reduced.matches?'1':String(1-progress*.85);
   finder.current.style.setProperty('--finder-shift',reduced.matches?'0px':`${Math.max(0,1-progress*2)*40}px`);
  };const scroll=()=>{if(!frame)frame=requestAnimationFrame(update)};update();addEventListener('scroll',scroll,{passive:true});reduced.addEventListener('change',update);return()=>{removeEventListener('scroll',scroll);reduced.removeEventListener('change',update);cancelAnimationFrame(frame)};
 },[]);
 const filtered=stores.filter(s=>(!state||normalizeState(s.state)===state)&&(!query.trim()||`${s.name} ${s.address} ${s.city||''}`.toLowerCase().includes(query.trim().toLowerCase())));
 const pages=Math.max(1,Math.ceil(filtered.length/6)),current=Math.min(page,pages),shown=filtered.slice((current-1)*6,current*6);
 function select(value:string){setState(value);setQuery('');setPage(1)}
 function turn(value:number){setPage(value);resultsRef.current?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'})}
 const hours=(s:WebsiteStore)=>s.opening===s.closing?'Hours to be confirmed':`${s.opening.slice(0,5)} – ${s.closing.slice(0,5)}`;
 return <main className="stores-locator">
  <header className="locator-hero" ref={hero}><div ref={copy}><p className="locator-eyebrow">OUR STORES</p><h1>{site.copy['stores-1']||'Find your'}<br/><em>{brand.name}.</em></h1><p>{site.copy['stores-description']}</p><a href="#find-stores" className="locator-scroll" aria-label="Find a store"><CaretRight size={25}/></a></div></header>
  <section className="locator-finder" id="find-stores" ref={finder} aria-label="Find a store in Malaysia">
   <div className="locator-controls"><label className="locator-search"><MagnifyingGlass size={22}/><input type="search" aria-label="Search stores in the selected state" placeholder={state?`Search in ${state}`:'Search stores'} value={query} onChange={e=>{setQuery(e.target.value);setPage(1)}}/></label><label className="locator-state"><span className="locator-sr">State or territory</span><select value={state} onChange={e=>select(e.target.value)}><option value="">All states</option>{malaysiaStates.map(s=><option key={s}>{s}</option>)}</select></label></div>
   <div className="locator-map-wrap"><div className="locator-total"><div><strong>{stores.length}</strong><img src={brand.logo} alt={brand.name}/></div><p>Stores across Malaysia</p></div><MalaysiaMap selected={state} onSelect={select}/></div>
   <div className="locator-results" ref={resultsRef}><div className="locator-results-heading"><h2>{state||'Across Malaysia'}</h2><span role="status">{filtered.length} {filtered.length===1?'store':'stores'}</span></div>
    <div className="locator-grid">{shown.map(s=>{const mapsUrl=s.mapsUrl||('https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(s.latitude!=null&&s.longitude!=null?`${s.latitude},${s.longitude}`:`${brand.name} ${s.name} ${s.address}`));return <article className="locator-card" key={s.id} role="link" tabIndex={0} onClick={()=>window.open(mapsUrl,'_blank','noopener,noreferrer')} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();window.open(mapsUrl,'_blank','noopener,noreferrer')}}}><img className="locator-photo" src={s.image||brand.storePlaceholder} alt={`${s.name} branch`} loading="lazy" onError={e=>{e.currentTarget.onerror=null;e.currentTarget.src=brand.storePlaceholder}}/><div className="locator-card-body"><h3>{s.name}</h3><p>{s.address}</p><span className="locator-hours"><Clock size={18}/>{hours(s)}</span><a href={mapsUrl} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()} aria-label={`Directions to ${s.name}`}>Directions<ArrowUpRight size={20}/></a></div></article>})}</div>
    {!shown.length&&<div className="locator-empty"><h3>{query?'No matching stores.':'More coffee stops to come.'}</h3><p>{query?'Try another name or address.':'No branches listed in this state yet.'}</p></div>}
    {pages>1&&<nav className="locator-pagination" aria-label="Store results pages"><button disabled={current===1} onClick={()=>turn(current-1)} aria-label="Previous page"><CaretLeft size={20}/></button>{Array.from({length:pages},(_,i)=>i+1).filter(n=>n===1||n===pages||Math.abs(n-current)<=1).map((n,i,list)=><span key={n}>{i>0&&n-list[i-1]>1&&<span className="page-gap">…</span>}<button aria-label={`Page ${n}`} aria-current={current===n?'page':undefined} onClick={()=>turn(n)}>{n}</button></span>)}<button disabled={current===pages} onClick={()=>turn(current+1)} aria-label="Next page"><CaretRight size={20}/></button></nav>}
   </div>
  </section>
 </main>;
}
