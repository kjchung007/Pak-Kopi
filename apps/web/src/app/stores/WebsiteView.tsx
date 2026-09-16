'use client';
import Link from 'next/link';
import Image from 'next/image';
import {brand} from '@coffee/brand';
import {useEditingPreview} from '@/components/useEditingPreview';
import type {SiteDocument} from '@coffee/brand/website';
export function StoresView({initial,editing,orderUrl}:{initial:SiteDocument;editing:boolean;orderUrl:string}){
 const site=useEditingPreview(initial,editing);
 const stores=site.stores||[]; const products=site.products||[];
return <main className="inner-page stores-page"><header className="page-hero stores-hero"><h1>{site.copy["stores-1"]}<br/><em>{brand.shortName}{site.copy["stores-2"]}</em></h1><p>{site.copy["stores-description"]}</p></header><section className="store-list">{stores.map((store)=><article key={store.id} data-reveal><img src={store.image||brand.storePlaceholder} alt={store.image?.includes("sandakan")?`${store.name} storefront`:"Illustrative café interior, not this branch"} loading="lazy"/><div><h2>{store.name}</h2><p>{store.address}</p><strong>{store.acceptingPickup ? "Demo ordering available all day · no real orders" : "Pickup not available yet · Hours awaiting confirmation"}</strong><div><a href={'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(`Pak Kopi ${store.name}`)}>{site.copy["stores-3"]}</a>{store.acceptingPickup && <a href={orderUrl}>{site.copy["stores-4"]}</a>}</div></div></article>)}</section></main>}
