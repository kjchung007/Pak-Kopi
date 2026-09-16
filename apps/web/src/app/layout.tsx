import { NetworkLinks } from '@/components/NetworkLinks';
import { SmoothScroll } from '@/components/SmoothScroll';
import {getSiteDocument,isDraftPreview} from '@/lib/site-document';
import 'lenis/dist/lenis.css';
import type { Metadata } from 'next';
import { MotionInit, SiteFooter, SiteHeader } from '@/components/SiteChrome';
import { orderUrl } from '@/lib/content';
import { brand } from '@coffee/brand';
import '@coffee/brand/theme.css';
import './globals.css';
import './customer-theme.css';
import './classic.css';
import './home.css';
import './website.css';
export const metadata:Metadata={metadataBase:new URL(process.env.NEXT_PUBLIC_SITE_URL||brand.urls.website),title:{default:brand.name,template:'%s | '+brand.name},description:brand.description,robots:{index:false,follow:false},manifest:'/manifest.webmanifest',icons:{icon:brand.icon}};
export default async function RootLayout({children}:Readonly<{children:React.ReactNode}>){
 const previewServer=await isDraftPreview();
 if(previewServer){try{await getSiteDocument();}catch{return <html lang="en"><body><main style={{maxWidth:600,margin:'15vh auto',padding:30}}><h1>Private draft preview</h1><p>Open a current preview link from Admin → Website Editor. Links expire after one hour.</p></main></body></html>;}}
 return <html lang="en"><body><NetworkLinks/><SmoothScroll/><MotionInit/><SiteHeader orderUrl={orderUrl}/>{brand.showDemoBanner !== false && <div className="demo-notice">{brand.notice}</div>}{children}<SiteFooter orderUrl={orderUrl}/>{previewServer&&<span style={{position:'fixed',bottom:12,left:12,zIndex:100,background:'#fff',color:'#513725',border:'1px solid #ddd',padding:'6px 12px',borderRadius:4,fontSize:12}}>Draft preview · Not published</span>}</body></html>}
