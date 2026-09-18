'use client';
import {appUrl} from '@coffee/brand/app-url';
import {brand} from '@coffee/brand';
import {useEffect,useState} from 'react';
import type {SiteDocument} from '@coffee/brand/website';

export function useEditingPreview(initial:SiteDocument,enabled:boolean){
 const [site,setSite]=useState(initial);
 useEffect(()=>setSite(initial),[initial]);
 useEffect(()=>{
  if(!enabled||window.parent===window)return;
  const origin=appUrl(process.env.NEXT_PUBLIC_ADMIN_URL,process.env.NODE_ENV==='development'?`${location.protocol}//${location.hostname}:5174`:brand.urls.admin,process.env.NODE_ENV==='development');
  function receive(event:MessageEvent){
   const match=event.origin===origin||event.origin===brand.urls.admin||/^https:\/\/pak-kopi-admin(-[a-z0-9-]+)?\.vercel\.app$/.test(event.origin);
   if(event.source!==window.parent||!match||event.data?.type!=='pak-kopi-edit-preview')return;
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
