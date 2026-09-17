import {useEffect, useRef, useState} from 'react';
import {mapsLink, coordinatesFromMaps} from '../lib/google-maps.mjs';
import './store-location.css';

type Change = {mapsUrl?:string; latitude?:number|null; longitude?:number|null};
type Props = {
  latitude?:number|null; longitude?:number|null; mapsUrl?:string;
  address:string; onChange:(value:Change)=>void;
};

export function StoreLocationPicker({latitude, longitude, mapsUrl='', onChange}:Props) {
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const request=useRef<AbortController|null>(null);
  const validLink=mapsLink(mapsUrl);
  const hasLocation=latitude!=null && longitude!=null && Number.isFinite(latitude) &&
    Number.isFinite(longitude) && Math.abs(latitude)<=90 && Math.abs(longitude)<=180;
  useEffect(()=>()=>request.current?.abort(),[]);

  function edit(value:string) {
    request.current?.abort();
    request.current=null;
    setBusy(false);
    setMessage('');
    const coordinates=mapsLink(value) ? coordinatesFromMaps(value) : null;
    onChange({mapsUrl:value, ...(coordinates || {})});
  }

  async function locate() {
    if (!validLink) {setMessage('Paste a Google Maps share link or place URL first.');return;}
    request.current?.abort();
    const controller=new AbortController();
    request.current=controller;
    setBusy(true);
    setMessage('');
    try {
      const response=await fetch('/api/resolve-maps',{
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({url:validLink}), signal:controller.signal,
      });
      const data=await response.json();
      if (controller.signal.aborted) return;
      if (!response.ok) throw new Error(data.error || 'Location lookup failed. Try again.');
      if (data.coordinates) {
        onChange(data.coordinates);
        setMessage('Branch location found. Save the store to apply it.');
      } else {
        setMessage('This link opens the shop, but its location could not be read. Open the shop in Google Maps, select its place listing, then paste the full browser URL and try again. Existing distance coordinates are unchanged.');
      }
    } catch (error) {
      if (!controller.signal.aborted) setMessage(error instanceof Error ? error.message : 'Location lookup unavailable. Try again.');
    } finally {
      if (request.current===controller) setBusy(false);
    }
  }

  return <section className="store-location" aria-label="Google Maps and distance">
    <h3>Google Maps</h3>
    <label className="store-location-link">
      Shop link for Directions
      <input type="url" value={mapsUrl} onChange={e=>edit(e.target.value)}
        placeholder="https://maps.app.goo.gl/…" aria-describedby="store-maps-help"
        aria-invalid={Boolean(mapsUrl.trim()&&!validLink)}/>
    </label>
    <p id="store-maps-help">In Google Maps, open this branch → Share → Copy link. Paste it here, then save the store. Customers open this exact link.</p>
    {mapsUrl.trim()&&!validLink&&<p role="alert">Use an HTTPS Google Maps share link or place URL.</p>}
    <div className="store-location-actions">
      {validLink&&<a href={validLink} target="_blank" rel="noopener noreferrer">Preview shop link</a>}
      <button type="button" disabled={busy||!validLink} onClick={()=>void locate()}>{busy?'Finding location…':'Get distance location'}</button>
    </div>
    <div className="store-distance-status">
      <strong>{hasLocation?'Distance location is set':'Distance location needed'}</strong>
      <p>{hasLocation?'Customers who share their location can see an approximate distance.':'Click Get distance location after pasting the link. No manual pin needed.'}</p>
    </div>
    {message&&<p role="status">{message}</p>}
    <details><summary>Store setup checklist</summary><ol>
      <li>Set the branch name, photo, state and address.</li>
      <li>Paste the Google Maps shop link and preview it.</li>
      <li>Get the distance location, then confirm phone and opening hours below.</li>
      <li>Save the store. Reload it to check the saved link.</li>
    </ol><p>Google Maps links do not import phone numbers or opening hours.</p></details>
  </section>;
}
