'use client';
import Link from 'next/link';
import Image from 'next/image';
import {brand} from '@coffee/brand';
import {useEditingPreview} from '@/components/useEditingPreview';
import type {SiteDocument} from '@coffee/brand/website';
export function MenuView({initial,editing,orderUrl}:{initial:SiteDocument;editing:boolean;orderUrl:string}){
 const site=useEditingPreview(initial,editing);
 const stores=site.stores||[]; const products=site.products||[];
  const groups = products.reduce<Record<string, typeof products>>((all, item) => {
    (all[item.category] ||= []).push(item);
    return all;
  }, {});

  return <main className="inner-page">
    <header className="page-hero menu-hero">
      <div className="menu-hero-copy">
        <h1>{site.copy["menu-1"]}<br /><em>{site.copy["menu-2"]}</em></h1>
        <p>{site.copy["menu-3"]}</p>
      </div>
      <div className="menu-hero-cup"><Image src={site.images.menuHeroImage || brand.HeroImage5 || brand.heroImage} alt="Enhanced Pak Kopi iced coffee isolated on white" width={1024} height={1536} sizes="(max-width: 760px) 110vw, 65vw" priority /></div>
      <div className="menu-hero-edge" aria-hidden="true" />
      <a className="menu-scroll" href="#menu-list" aria-label="Scroll to the drinks"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 9 7 7 7-7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg></a>
    </header>
    <nav className="category-jump" aria-label="Menu categories">
      {Object.keys(groups).map((name) => <a key={name} href={`#${name.toLowerCase().replaceAll(" ", "-")}`}>{name}</a>)}
    </nav>
    <div className="menu-sections" id="menu-list">
      {Object.entries(groups).map(([category, items]) => <section id={category.toLowerCase().replaceAll(" ", "-")} key={category} data-reveal>
        <div className="menu-category-heading"><h2>{category}</h2><span>{items.length}{site.copy["menu-4"]}</span></div>
        <div className="menu-grid">
          {items.map((item) => <article key={item.id}>
            <div><img src={item.image} alt={item.name} loading="lazy" /></div>
            <h3>{item.name}</h3>
            <p>{item.description}</p>
            <a href={orderUrl}>{site.copy["menu-5"]}</a>
          </article>)}
        </div>
      </section>)}
    </div>
  </main>;
}
