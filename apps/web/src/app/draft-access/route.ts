import {NextRequest,NextResponse} from 'next/server';
import {previewServer,siteRequest} from '@/lib/site-document';
export async function GET(req:NextRequest){
 if(!previewServer)return new Response('Draft links only work on the preview server.',{status:404});
 const token=req.nextUrl.searchParams.get('token')||'';
 if(!/^[a-f0-9-]{36}$/.test(token))return new Response('Invalid preview link',{status:401});
 const doc=await siteRequest('rpc/read_website_preview',{p_token:token});
 if(!doc)return new Response('Preview link expired. Generate a new link in the Website Editor.',{status:401});
 const path=req.nextUrl.searchParams.get('page')||'/';
 const response=new NextResponse(null,{status:307,headers:{Location:['/','/menu','/story','/stores'].includes(path)?path:'/'}});
 response.cookies.set('pak-website-preview',token,{httpOnly:true,sameSite:'lax',secure:req.nextUrl.protocol==='https:',maxAge:3600,path:'/'});
 response.headers.set('Referrer-Policy','no-referrer');response.headers.set('Cache-Control','no-store');return response;
}
