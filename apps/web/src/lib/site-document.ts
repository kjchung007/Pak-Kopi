import {cache} from 'react';
import {cookies,headers} from 'next/headers';
import {defaultSite,type SiteDocument} from '@coffee/brand/website';
export const previewServer=process.env.WEBSITE_DRAFT_PREVIEW==='true';
export async function isDraftPreview(){return previewServer||(await headers()).get('x-pak-draft-path')==='1';}
export async function siteRequest(path:string,body?:unknown){
 const url=(process.env.NEXT_PUBLIC_SUPABASE_URL||process.env.VITE_SUPABASE_URL)?.trim().replace(/\/$/,'');
 const key=(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.VITE_SUPABASE_PUBLISHABLE_KEY)?.trim();
 if(!url||!key)throw new Error('Website Supabase environment variables are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in Vercel, then redeploy.');
 const r=await fetch(`${url}/rest/v1/${path}`,{method:body?'POST':'GET',cache:'no-store',headers:{apikey:key,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
 if(!r.ok)throw new Error(`Website Supabase connection failed (${r.status}). Check the website project's Supabase URL and publishable key in Vercel.`);return r.json();
}
export const getSiteDocument=cache(async():Promise<SiteDocument>=>{
 let doc:Partial<SiteDocument>|undefined;
  if(await isDraftPreview()){
   const headerList=await headers();
   const token=headerList.get('x-pak-preview-token')||(await cookies()).get('pak-website-preview')?.value;
   if(token){
     try{
       doc=await siteRequest('rpc/read_website_preview',{p_token:token});
     }catch{
       try{const rows=await siteRequest('website_public?select=content&id=eq.1');doc=rows[0]?.content;}catch{}
     }
   }else{
     try{const rows=await siteRequest('website_public?select=content&id=eq.1');doc=rows[0]?.content;}catch{}
   }
  }else{
   try{const rows=await siteRequest('website_public?select=content&id=eq.1');doc=rows[0]?.content;}catch{/* Original website remains available before setup. */}
  }
 return {...defaultSite,...doc,copy:{...defaultSite.copy,...doc?.copy},images:{...defaultSite.images,...doc?.images}};
});
