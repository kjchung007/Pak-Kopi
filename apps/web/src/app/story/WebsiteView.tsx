'use client';
import Link from 'next/link';
import Image from 'next/image';
import {brand} from '@coffee/brand';
import {useEditingPreview} from '@/components/useEditingPreview';
import type {SiteDocument} from '@coffee/brand/website';
export function StoryView({initial,editing,orderUrl}:{initial:SiteDocument;editing:boolean;orderUrl:string}){
 const site=useEditingPreview(initial,editing);
 const stores=site.stores||[]; const products=site.products||[];
 return <main className="inner-page story-page">
 <header className="page-hero story-hero story-photo-hero"><Image src={site.images.aboutHeroImage || brand.storePlaceholder} alt="Pak Kopi coffee truck scene with black brand logos on the drinks" fill sizes="100vw" priority /><div className="story-photo-copy"><h1>{site.copy["story-1"]}<br/><em>{site.copy["story-2"]}</em></h1><p>{site.copy["story-3"]}</p></div></header>
 <section className="story-opening" data-reveal><img src={site.images.HeroImage4 || brand.storePlaceholder} alt="Pak Kopi being freshly poured" loading="lazy"/><div><h2>{site.copy["story-4"]}</h2><p>{site.copy["story-5"]}</p><p>{site.copy["story-6"]}</p></div></section>
 <section className="story-quote" data-reveal><blockquote>{site.copy["story-7"]}<br/>{site.copy["story-8"]}</blockquote><p>{site.copy["story-9"]}</p></section>
 <section className="story-chapters section" data-reveal>
 <article><span>{site.copy["story-10"]}</span><h2>{site.copy["story-11"]}</h2><p>{site.copy["story-12"]}</p></article>
 <article><span>{site.copy["story-13"]}</span><h2>{site.copy["story-14"]}</h2><p>{site.copy["story-15"]}</p></article>
 <article><span>{site.copy["story-16"]}</span><h2>{site.copy["story-17"]}</h2><p>{site.copy["story-18"]}</p></article>
 </section>
 <section className="section story-sources"><p>{site.copy["story-19"]}</p><p>{site.copy["story-20"]}<a href="https://pakopi.orderla.my/menu" target="_blank" rel="noreferrer">{site.copy["story-21"]}</a>{site.copy["story-22"]}<a href="https://www.maybank2u.com.my/iwov-resources/pdf/personal/promotions/2022/FB_merchant-list.pdf" target="_blank" rel="noreferrer">{site.copy["story-23"]}</a>{site.copy["story-24"]}</p></section>
 <section className="closing-cta"><p>{site.copy["story-25"]}</p><h2>{site.copy["story-26"]}<br/>{site.copy["story-27"]}</h2><Link className="button gold" href="/stores">{site.copy["story-28"]}</Link></section>
 </main>;
}

