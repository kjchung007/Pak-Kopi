'use client';
import Link from '@/components/PreviewLink';
import Image from 'next/image';
import {brand} from '@coffee/brand';
import {useEditingPreview} from '@/components/useEditingPreview';
import type {SiteDocument} from '@coffee/brand/website';
export function HomeView({initial,editing,orderUrl}:{initial:SiteDocument;editing:boolean;orderUrl:string}){
 const site=useEditingPreview(initial,editing);
 const stores=site.stores||[]; const products=site.products||[];
  const branches = stores.filter(store => store.featured ?? /Bandar Sandakan|Prima Sandakan/.test(store.name));

  return <main className="pak-home">
    <section className="home-banner" aria-labelledby="home-heading">
      <Image className="home-banner-image" src={site.images.homeBannerImage || brand.heroImage} alt="Illustrative Pak Kopi iced coffee and milk tea concept" fill sizes="(max-width: 760px) 100vw, 72vw" priority />
      <div className="home-banner-copy">
        <h1 id="home-heading">{site.copy["home-1"]}<br />{site.copy["home-2"]}</h1>
        <p>{site.copy["home-3"]}</p>
        <Link className="home-button" href="/menu">{site.copy["home-4"]}</Link>
      </div>
    </section>
    <section className="home-intro">
      <h2>{site.copy["home-5"]}<br />{site.copy["home-6"]}<br /><span>{site.copy["home-7"]}</span></h2>
      <p>{site.copy["home-8"]}<br />{site.copy["home-9"]}</p>
      <Link className="home-link" href="/story">{site.copy["home-10"]}</Link>
    </section>
    <section className="home-brew" aria-labelledby="brew-heading">
      <div className="home-brew-photos">
        <Image src={site.images.HeroImage4 || brand.heroImage} alt="Hot kopi being poured into a Pak Kopi cup" width={447} height={447} sizes="(max-width: 760px) 46vw, 380px" />
        <Image src={site.images.HeroImage5 || brand.heroImage} alt="Kopi poured over ice and milk in a Pak Kopi cup" width={447} height={447} sizes="(max-width: 760px) 46vw, 380px" />
      </div>
      <div className="home-brew-copy">
        <h2 id="brew-heading">{site.copy["home-11"]}<br />{site.copy["home-12"]}</h2>
        <p>{site.copy["home-13"]}</p>
        <Link className="home-link" href="/menu">{site.copy["home-14"]}</Link>
      </div>
    </section>
    <section className="home-drinks">
      <div><h2>{site.copy["home-15"]}</h2><p>{site.copy["home-16"]}</p></div>
      <Image src={site.images.websiteLineupImage || brand.secondaryHeroImage || brand.heroImage} alt="A selection of Pak Kopi iced drinks" width={1448} height={1086} sizes="(max-width: 760px) 90vw, 515px" />
      <Link className="home-button" href="/menu">{site.copy["home-17"]}</Link>
    </section>
    <section className="home-branches">
      <div className="home-section-title"><h2>{site.copy["home-18"]}</h2><p>{site.copy["home-19"]}</p></div>
      <div className="home-branch-grid">{branches.map(store => <Link href="/stores" className="home-branch" key={store.id}>
        <div><img src={store.image} alt={`${store.name} storefront`} loading="lazy" width={680} height={510} /></div>
        <h3>{store.name}</h3>
      </Link>)}</div>
      <Link className="home-link" href="/stores">{site.copy["home-20"]}</Link>
    </section>
    <section className="home-pickup"><h2>{site.copy["home-21"]}</h2><p>{site.copy["home-22"]}</p><a className="home-button" href={orderUrl}>{site.copy["home-23"]}</a></section>
    <p className="home-image-note">{site.copy["home-24"]}</p>
  </main>;
}
