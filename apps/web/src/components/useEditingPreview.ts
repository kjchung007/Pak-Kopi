'use client';
import {brand} from '@coffee/brand';
import {useEffect,useState} from 'react';
import type {SiteDocument} from '@coffee/brand/website';

export function useEditingPreview(initial:SiteDocument,enabled:boolean){
 const [site,setSite]=useState(initial);
 useEffect(()=>setSite(initial),[initial]);
 useEffect(()=>{
  if(!enabled||window.parent===window)return;
  const origin=process.env.NEXT_PUBLIC_ADMIN_URL||(process.env.NODE_ENV==='development'?`${location.protocol}//${location.hostname}:5174`:brand.urls.admin);
  function receive(event:MessageEvent){
   if(event.source!==window.parent||event.origin!==origin||event.data?.type!=='pak-kopi-edit-preview')return;
   const content=event.data.content as SiteDocument;
   if(content?.schema!==1||!content.copy||!content.images||!Array.isArray(content.stores)||!Array.isArray(content.products))return;
   setSite(content);
  }
  window.addEventListener('message',receive);
  window.parent.postMessage({type:'pak-kopi-preview-ready'},origin);
  return ()=>window.removeEventListener('message',receive);
 },[enabled]);
 return site;
}
