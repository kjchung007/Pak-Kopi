"use client";
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

// Keep cross-app development links on the host the visitor actually opened.
// On a phone, localhost names the phone, not the computer running this suite.
export function NetworkLinks(){
 const path=usePathname();
 useEffect(()=>{
  const rewrite=(anchor:HTMLAnchorElement)=>{
   const url=new URL(anchor.href,location.href);
   if(['localhost','127.0.0.1'].includes(url.hostname)&&['3000','5173'].includes(url.port)){
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
