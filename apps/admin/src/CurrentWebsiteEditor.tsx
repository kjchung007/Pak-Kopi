import {useEffect,useState,useRef} from 'react';
import type {SupabaseClient} from '@supabase/supabase-js';
import {defaultSite,type SiteDocument,type WebsiteStore} from '@coffee/brand/website';
import './website-workspace.css';
function EditorIcon({kind}:{kind:'text'|'image'|'history'|'store'}){
 const paths={text:'M4 5h16M12 5v14M8 19h8',image:'M4 4h16v16H4z M4 16l5-5 4 4 3-3 4 4 M8 8h.01',history:'M3 11a9 9 0 1 1 3 8M3 4v7h7M12 7v5l3 2',store:'M4 10v10h16V10M3 10l2-6h14l2 6M9 20v-6h6v6'};
 return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[kind]}/></svg>;
}
const pages=[['home','Home','/'],['menu','Menu','/menu'],['story','About','/story'],['stores','Stores','/stores']];
const imageLabels:Record<string,string>={homeBannerImage:'Home hero',HeroImage4:'Brewing photo',HeroImage5:'Iced drink photo',websiteLineupImage:'Drink lineup',menuHeroImage:'Menu hero',aboutHeroImage:'About hero'};
export function CurrentWebsiteEditor({client,onExit}:{client:SupabaseClient;onExit:()=>void}){
 const [doc,setDoc]=useState<SiteDocument|null>(null),[revision,setRevision]=useState(0),[versions,setVersions]=useState<{id:number;created_at:string}[]>([]);
 const [page,setPage]=useState('home'),[device,setDevice]=useState('desktop'),[token,setToken]=useState(''),[busy,setBusy]=useState(false),[dirty,setDirty]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
 const previewFrame=useRef<HTMLIFrameElement>(null);
 const past=useRef<SiteDocument[]>([]),future=useRef<SiteDocument[]>([]),savedDoc=useRef<SiteDocument|null>(null);
 const host=window.location.hostname;
 const live=(import.meta.env.VITE_WEBSITE_URL||`${location.protocol}//${host}:3000`).replace(/\/$/,'').replace('localhost',host);
 const preview=(import.meta.env.VITE_WEBSITE_PREVIEW_URL||`${location.protocol}//${host}:3001`).replace(/\/$/,'').replace('localhost',host);
 const path=pages.find(p=>p[0]===page)![2];
 const previewLink=token?`${preview}/draft-access?token=${token}&page=${encodeURIComponent(path)}&v=${revision}`:'';
 function sendPreview(){if(doc)previewFrame.current?.contentWindow?.postMessage({type:'pak-kopi-edit-preview',content:doc},new URL(preview).origin);}
 useEffect(()=>{sendPreview();},[doc,preview]);
 useEffect(()=>{function ready(event:MessageEvent){if(event.source===previewFrame.current?.contentWindow&&event.origin===new URL(preview).origin&&event.data?.type==='pak-kopi-preview-ready')sendPreview();}window.addEventListener('message',ready);return()=>window.removeEventListener('message',ready);},[doc,preview]);
 async function baseline(){const r=await fetch(live+'/api/site-baseline',{cache:'no-store'});if(!r.ok)throw new Error('Start the live website to copy its current content.');return r.json();}
 async function call(action:string,content?:SiteDocument,version?:number){
  const {data,error}=await client.rpc('website_workspace_action',{p_action:action,p_content:content??null,p_revision:revision,p_version:version??null});
  if(error)throw new Error(error.message);return data;
 }
 function apply(data:{content:SiteDocument;revision:number;versions:{id:number;created_at:string}[]}){past.current=[];future.current=[];savedDoc.current=data.content;setDoc(data.content);setRevision(data.revision);setVersions(data.versions);setDirty(false);}
 async function load(){setBusy(true);setError('');try{apply(await call('load',await baseline()));setToken((await call('preview')).token);}catch(e){setError(String(e));}finally{setBusy(false);}}
 useEffect(()=>{void load();},[client]);
 function update(next:SiteDocument){if(doc){past.current=[...past.current,doc].slice(-100);future.current=[];}setDoc(next);setDirty(true);setMessage('Preview updated. Save draft to keep your changes.');}
 function undo(){if(busy||!doc||!past.current.length)return;const previous=past.current.pop()!;future.current.push(doc);setDoc(previous);setDirty(JSON.stringify(previous)!==JSON.stringify(savedDoc.current));setError('');setMessage('Change undone. Preview updated.');}
 function redo(){if(busy||!doc||!future.current.length)return;const next=future.current.pop()!;past.current.push(doc);setDoc(next);setDirty(JSON.stringify(next)!==JSON.stringify(savedDoc.current));setError('');setMessage('Change restored. Preview updated.');}
 useEffect(()=>{function shortcut(e:KeyboardEvent){if(!(e.ctrlKey||e.metaKey)||e.altKey)return;const key=e.key.toLowerCase();if(key==='z'||(key==='y'&&e.ctrlKey)){e.preventDefault();if(e.shiftKey||key==='y')redo();else undo();}}window.addEventListener('keydown',shortcut);return()=>window.removeEventListener('keydown',shortcut);},[doc,busy]);
 async function save(){if(!doc)return;setBusy(true);setError('');try{apply(await call('save',doc));setMessage('Draft saved. The live website is unchanged.');}catch(e){setError(String(e));}finally{setBusy(false);}}
 async function publish(){if(!doc||dirty||!window.confirm('Publish this saved draft to the live website? The previous live version will be retained.'))return;setBusy(true);setError('');try{apply(await call('publish',await baseline()));setMessage('Published. Refresh the live website to see this version.');}catch(e){setError(String(e));}finally{setBusy(false);}}
 async function restore(version?:number){if(!window.confirm('Replace this draft? Unsaved changes will be discarded. The live website will not change.'))return;setBusy(true);setError('');try{apply(await call(version?'restore':'reset',version?undefined:await baseline(),version));setMessage('Draft replaced. Live website unchanged.');}catch(e){setError(String(e));}finally{setBusy(false);}}
 async function newLink(){try{setToken((await call('preview')).token);setMessage('New preview link ready; valid for one hour.');}catch(e){setError(String(e));}}
 async function upload(file:File,assign:(url:string)=>void){
  if(!['image/jpeg','image/png','image/webp','image/avif'].includes(file.type)||file.size>5000000){setError('Choose a JPG, PNG, WebP or AVIF image under 5 MB.');return;}
  setBusy(true);setError('');try{
   const name=`website-drafts/${crypto.randomUUID()}-${file.name.replace(/[^a-z0-9._-]/gi,'-')}`;
   const {error}=await client.storage.from('public-assets').upload(name,file,{contentType:file.type,upsert:false});if(error)throw error;
   assign(client.storage.from('public-assets').getPublicUrl(name).data.publicUrl);
  }catch(e){setError(String(e));}finally{setBusy(false);}
 }
 function changeStore(id:number,patch:Partial<WebsiteStore>){if(doc)update({...doc,stores:doc.stores!.map(s=>s.id===id?{...s,...patch}:s)});}
 return <section className="site-workspace">
  <header><button onClick={onExit}>← Admin</button><strong>Website editor</strong><select aria-label="Page" value={page} onChange={e=>setPage(e.target.value)}>{pages.map(([id,title])=><option key={id} value={id}>{title}</option>)}</select><select aria-label="Preview size" value={device} onChange={e=>setDevice(e.target.value)}><option value="desktop">Desktop</option><option value="tablet">Tablet</option><option value="mobile">Mobile</option></select><button title="Undo (Ctrl/Cmd+Z)" disabled={busy||!past.current.length} onClick={undo}>Undo</button><button title="Redo (Ctrl/Cmd+Shift+Z)" disabled={busy||!future.current.length} onClick={redo}>Redo</button><button className="save-draft" disabled={busy||!doc||!dirty} onClick={()=>void save()}>Save draft</button><button disabled={busy||!doc||dirty} onClick={()=>void publish()}>Publish saved draft</button><a href={live+path} target="_blank" rel="noreferrer">Live website ↗</a></header>
  <div className="workspace-status" role="status">{error||message||'Edit a copy of the current website. Save and preview before publishing.'}</div>
  {!doc?<div className="workspace-empty">{busy?'Loading the current website…':'Could not load the draft.'}<button onClick={()=>void load()}>Reload</button></div>:<div className="workspace-grid">
   <aside>
    <h2>{pages.find(p=>p[0]===page)![1]} content</h2><p>Expand a section to start editing.</p>
    <details key={page+"text"}><summary><EditorIcon kind="text"/>Text</summary>{Object.entries(doc.copy).filter(([key])=>key.startsWith(page+'-')).map(([key,value])=><label key={key}>{defaultSite.copy[key]?.slice(0,55)||key}<textarea value={value} maxLength={10000} onChange={e=>update({...doc,copy:{...doc.copy,[key]:e.target.value}})}/></label>)}</details>
    <details key={page+"images"}><summary><EditorIcon kind="image"/>Images</summary>{Object.entries(doc.images).filter(([key])=>page==='home'?key!=='menuHeroImage'&&key!=='aboutHeroImage':page==='menu'?key==='menuHeroImage':page==='story'?['aboutHeroImage','HeroImage4'].includes(key):false).map(([key,value])=><label key={key}>{imageLabels[key]}<img src={value.startsWith('/')?live+value:value} alt="Current draft image"/><input aria-label={imageLabels[key]+' URL'} value={value} onChange={e=>update({...doc,images:{...doc.images,[key]:e.target.value}})}/><input aria-label={'Upload '+imageLabels[key]} type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={busy} onChange={e=>{const f=e.target.files?.[0];if(f)void upload(f,url=>update({...doc,images:{...doc.images,[key]:url}}));}}/></label>)}</details>
    {page==='stores'&&<details open><summary><EditorIcon kind="store"/>Website branch listings</summary><p>These listings do not change operational stores, staff, menus or pickup settings.</p>{doc.stores?.map(s=><details className="draft-store" key={s.id}><summary>{s.name}</summary><label>Name<input value={s.name} onChange={e=>changeStore(s.id,{name:e.target.value})}/></label><label>Address<textarea value={s.address} onChange={e=>changeStore(s.id,{address:e.target.value})}/></label><label>Photo URL<input value={s.image||''} onChange={e=>changeStore(s.id,{image:e.target.value})}/></label><input aria-label={'Upload photo for '+s.name} type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={busy} onChange={e=>{const f=e.target.files?.[0];if(f)void upload(f,url=>changeStore(s.id,{image:url}));}}/><label><input type="checkbox" checked={s.featured??/Bandar Sandakan|Prima Sandakan/.test(s.name)} onChange={e=>changeStore(s.id,{featured:e.target.checked})}/>Show on home page</label><button onClick={()=>update({...doc,stores:doc.stores!.filter(x=>x.id!==s.id)})}>Remove draft listing</button></details>)}<button onClick={()=>update({...doc,stores:[...(doc.stores||[]),{id:-Date.now(),name:'New branch',address:'Address awaiting confirmation',image:'/brand/cafe-counter.jpg',phone:'',opening:'00:00',closing:'00:00',acceptingPickup:false,featured:false}]})}>Add branch listing</button></details>}
    <details><summary><EditorIcon kind="history"/>History & preview access</summary><button disabled={busy} onClick={()=>void restore()}>Reset draft from live</button>{versions.map(v=><button key={v.id} disabled={busy} onClick={()=>void restore(v.id)}>Restore version {v.id} to draft</button>)}<button onClick={()=>void newLink()}>Renew preview link</button><button onClick={async()=>{await call('revoke_previews');setToken('');setMessage('All preview links revoked.');}}>Revoke all preview links</button></details>
   </aside>
   <div className="workspace-preview"><div className="workspace-preview-tools"><a href={previewLink||undefined} target="_blank" rel="noreferrer">Open saved draft ↗</a><button disabled={!token} onClick={()=>{navigator.clipboard.writeText(previewLink).then(()=>setMessage('Preview link copied. Open it on a device on the same Wi-Fi.')).catch(()=>setMessage('Copy the preview link from the field below.'));}}>Copy preview link</button><span>{dirty?'Preview includes unsaved changes':'Saved draft · link expires in 1 hour'}</span></div><details className="preview-sharing"><summary>Preview on another device</summary><input aria-label="Saved draft preview link" readOnly value={previewLink}/><p>Phone: replace localhost with your computer’s Wi-Fi address if needed. Preview server: port 3001.</p></details>{token?<iframe ref={previewFrame} onLoad={sendPreview} title="Current website draft preview" src={previewLink} style={{width:device==='mobile'?390:device==='tablet'?768:'100%'}}/>:<button onClick={()=>void newLink()}>Create protected preview</button>}</div>
  </div>}
 </section>;
}
