'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import type {ComponentProps} from 'react';
export default function PreviewLink(props:ComponentProps<typeof Link>){
 const path=usePathname();
 const draft=path==='/preview'||path.startsWith('/preview/');
 const href=props.href;
 if(draft&&typeof href==='string'&&['/','/menu','/story','/stores'].includes(href))return <Link {...props} href={'/preview'+href} prefetch={false}/>;
 return <Link {...props}/>;
}
