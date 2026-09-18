'use client';
import Link from 'next/link';
import {usePathname, useSearchParams} from 'next/navigation';
import {Suspense, type ComponentProps} from 'react';

function InnerLink(props: ComponentProps<typeof Link>){
 const path=usePathname();
 const searchParams=useSearchParams();
 const token=searchParams.get('token');
 const draft=path==='/preview'||path.startsWith('/preview/');
 const href=props.href;
 if(draft&&typeof href==='string'&&['/','/menu','/story','/stores'].includes(href)){
  const target='/preview'+href+(token?`?token=${encodeURIComponent(token)}`:'');
  return <Link {...props} href={target} prefetch={false}/>;
 }
 return <Link {...props}/>;
}

export default function PreviewLink(props:ComponentProps<typeof Link>){
 return (
  <Suspense fallback={<Link {...props}/>}>
   <InnerLink {...props}/>
  </Suspense>
 );
}
