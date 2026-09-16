import {cache} from 'react';
import {cookies} from 'next/headers';
import {defaultSite,type SiteDocument} from '@coffee/brand/website';
export const previewServer=process.env.WEBSITE_DRAFT_PREVIEW==='true';
export async function siteRequest(path:string,body?:unknown){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)throw new Error('Website connection is unavailable');
 const r=await fetch(`${url}/rest/v1/${path}`,{method:body?'POST':'GET',cache:'no-store',headers:{apikey:key,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
 if(!r.ok)throw new Error('Website content is unavailable');return r.json();
}
export const getSiteDocument=cache(async():Promise<SiteDocument>=>{
 let doc:Partial<SiteDocument>|undefined;
 if(previewServer){
  const token=(await cookies()).get('pak-website-preview')?.value;
  if(!token)throw new Error('Open a valid draft preview link from the admin Website Editor.');
  doc=await siteRequest('rpc/read_website_preview',{p_token:token});
  if(!doc)throw new Error('This draft preview link has expired. Open a new link from the Website Editor.');
 }else{
  try{const rows=await siteRequest('website_public?select=content&id=eq.1');doc=rows[0]?.content;}catch{/* Original website remains available before setup. */}
 }
 return {...defaultSite,...doc,copy:{...defaultSite.copy,...doc?.copy},images:{...defaultSite.images,...doc?.images}};
});
