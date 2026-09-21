"use client";
import {brand} from '@coffee/brand';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

// Keep cross-app development links on the host the visitor actually opened.
// On a phone, localhost names the phone, not the computer running this suite.
export function NetworkLinks(){
 const path=usePathname();
 useEffect(()=>{
  const rewrite=(anchor:HTMLAnchorElement)=>{
   const raw=anchor.getAttribute('href');
   if(!raw||raw.startsWith('/')||raw.startsWith('#')||raw.startsWith('mailto:')||raw.startsWith('tel:')) return;
   const url=new URL(anchor.href,location.href);
   if(process.env.NODE_ENV!=='development'){
    const targets:Record<string,string>={'3000':brand.urls.website,'3001':brand.urls.website+'/preview','5173':brand.urls.order,'5174':brand.urls.admin,'5175':brand.urls.staff};
    if(targets[url.port]){const target=new URL(targets[url.port]);target.pathname=target.pathname.replace(/\/$/,'')+url.pathname;target.search=url.search;target.hash=url.hash;anchor.href=target.href;}
    return;
   }
   if(['localhost','127.0.0.1'].includes(url.hostname)&&url.port==='5173'){
    url.hostname=location.hostname;anchor.href=url.href;
   }
  };
  document.querySelectorAll<HTMLAnchorElement>('a[href]').forEach(rewrite);
  const onClick=(event:MouseEvent)=>{const anchor=(event.target as Element)?.closest<HTMLAnchorElement>('a[href]');if(anchor)rewrite(anchor);};
  document.addEventListener('click',onClick,true);
  return()=>document.removeEventListener('click',onClick,true);
 },[path]);
 return null;
}
