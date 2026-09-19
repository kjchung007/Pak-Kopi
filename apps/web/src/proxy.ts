import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request:NextRequest){
  const requestHeaders=new Headers(request.headers);
  requestHeaders.set('x-pak-draft-path','0');
  if(request.nextUrl.pathname==='/preview'||request.nextUrl.pathname.startsWith('/preview/')){
    const path=request.nextUrl.pathname.slice('/preview'.length)||'/';
    if(!['/','/menu','/story','/stores','/draft-access'].includes(path))return new NextResponse('Not found',{status:404});
    requestHeaders.set('x-pak-draft-path','1');
    const token=request.nextUrl.searchParams.get('token')||request.cookies.get('pak-website-preview')?.value;
    if(token){requestHeaders.set('x-pak-preview-token',token);}
    const target=request.nextUrl.clone();target.pathname=path;
    const response=NextResponse.rewrite(target,{request:{headers:requestHeaders}});
    if(token&&!request.cookies.get('pak-website-preview')){
      const isHttps=request.nextUrl.protocol==='https:';
      response.cookies.set('pak-website-preview',token,{httpOnly:true,sameSite:isHttps?'none':'lax',secure:isHttps,partitioned:isHttps,maxAge:3600,path:'/'});
    }
    response.headers.set('Cache-Control','private, no-store');
    response.headers.set('Referrer-Policy','no-referrer');
    response.headers.set('X-Robots-Tag','noindex, nofollow');
    response.headers.delete('X-Frame-Options');
    response.headers.set('Content-Security-Policy',"frame-ancestors 'self' https://pak-kopi-admin.vercel.app https://*.vercel.app http://localhost:* http://127.0.0.1:* http://192.168.*:*");
    return response;
  }
  if(request.method!=="GET"&&request.method!=="HEAD")return NextResponse.next({request:{headers:requestHeaders}});
  if(request.nextUrl.pathname.startsWith('/api/'))return NextResponse.next({request:{headers:requestHeaders}});
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL||process.env.VITE_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if(!url||!key)return NextResponse.next({request:{headers:requestHeaders}});
  try{
    const endpoint=new URL(`${url}/rest/v1/website_redirects`);
    endpoint.searchParams.set("select","to_path,status_code");
    endpoint.searchParams.set("from_path",`eq.${request.nextUrl.pathname}`);
    endpoint.searchParams.set("active","eq.true");
    endpoint.searchParams.set("limit","1");
    const response=await fetch(endpoint,{headers:{apikey:key,Authorization:`Bearer ${key}`},next:{revalidate:60},signal:AbortSignal.timeout(3000)});
    if(!response.ok)return NextResponse.next({request:{headers:requestHeaders}});
    const [redirect]=await response.json() as {to_path:string;status_code:number}[];
    if(!redirect)return NextResponse.next({request:{headers:requestHeaders}});
    const destination=new URL(redirect.to_path,request.url);
    destination.search=request.nextUrl.search;
    return NextResponse.redirect(destination,redirect.status_code);
  }catch{return NextResponse.next({request:{headers:requestHeaders}})}
}

export const config={matcher:["/((?!_next|favicon|sitemap.xml|robots.txt|assets|brand/|fonts/|manifest.webmanifest|design-preview/).*)"]};
