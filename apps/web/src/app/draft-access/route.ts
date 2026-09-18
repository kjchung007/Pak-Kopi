import {NextRequest,NextResponse} from 'next/server';
import {previewServer,siteRequest} from '@/lib/site-document';
export async function GET(req:NextRequest){

 const token=req.nextUrl.searchParams.get('token')||'';
 if(!/^[a-f0-9-]{36}$/.test(token))return new Response('Invalid preview link',{status:401});
 let doc;try{doc=await siteRequest('rpc/read_website_preview',{p_token:token});}catch(e){return new Response(e instanceof Error?e.message:'Draft connection is unavailable',{status:503,headers:{'Cache-Control':'no-store'}});}
 if(!doc)return new Response('Preview link expired. Generate a new link in the Website Editor.',{status:401});
 const path=req.nextUrl.searchParams.get('page')||'/';
 const targetPath=(['/','/menu','/story','/stores'].includes(path)?path:'/');
 const destination=(previewServer?'':'/preview')+targetPath;
 const redirectUrl=new URL(destination,req.url);
 redirectUrl.searchParams.set('token',token);
 const v=req.nextUrl.searchParams.get('v');
 if(v)redirectUrl.searchParams.set('v',v);
 const response=NextResponse.redirect(redirectUrl,{status:307});
 response.cookies.set('pak-website-preview',token,{httpOnly:true,sameSite:'none',secure:true,partitioned:true,maxAge:3600,path:'/'});
 response.headers.set('Referrer-Policy','no-referrer');response.headers.set('Cache-Control','no-store');return response;
}
