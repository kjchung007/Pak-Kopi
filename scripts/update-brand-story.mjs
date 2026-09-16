import fs from 'node:fs';
const edit=(p,f)=>fs.writeFileSync(p,f(fs.readFileSync(p,'utf8')));
const b=JSON.parse(fs.readFileSync('packages/brand/brand.json'));
b.tagline='Freshly brewed. Everyday kopi.';
b.description='Freshly brewed kopi and tea at everyday prices, made for your daily coffee break.';
b.headline={lead:'Freshly brewed.',accent:'Everyday kopi.'};
b.locationNote='This ordering preview features three Sabah branches. It is a selected demo menu, not the complete Pakopi network.';
fs.writeFileSync('packages/brand/brand.json',JSON.stringify(b,null,2)+'\n');
edit('packages/brand/src/index.ts',s=>s.replace('photoNote?:string;', 'headline?:{lead:string;accent:string}; photoNote?:string;'));
edit('apps/web/src/app/page.tsx',s=>s.replace('Your next<br/><em>kopi break.</em>','{brand.headline?.lead||"Your next"}<br/><em>{brand.headline?.accent||"coffee break."}</em>').replace('About this demo','About Pakopi'));
edit('apps/web/src/components/SiteChrome.tsx',s=>s.replace('About the demo','About Pakopi'));
edit('scripts/export-starter.mjs',s=>s.replace("id:'your-coffee',", "headline:{lead:'A cup,',accent:'at your pace.'},id:'your-coffee',"));
fs.writeFileSync('apps/web/src/app/story/page.tsx',`import { getPublishedPageByPath } from '@/lib/content';
import { PublishedPage } from '@/components/PublishedPage';
import Link from 'next/link';
import { brand } from '@coffee/brand';
export const metadata={title:'About Pakopi'};
export default async function StoryPage(){
 const published=await getPublishedPageByPath('/story');if(published)return <PublishedPage page={published}/>;
 return <main className="inner-page story-page">
 <header className="page-hero story-hero"><p>Kopi, tea and everyday moments</p><h1>Familiar flavours.<br/><em>A daily favourite.</em></h1></header>
 <section className="story-opening" data-reveal><img src={brand.storePlaceholder} alt="Illustrative café interior"/><div><h2>A simple idea, freshly brewed.</h2><p>Pakopi’s published mission centres on freshly brewed coffee and tea at reasonable prices. It is an everyday kind of pleasure: a familiar drink, a quick pause, a moment to catch up.</p><p>From kopi and cham to tea and chocolate, the menu brings familiar favourites into your daily routine.</p></div></section>
 <section className="story-quote" data-reveal><blockquote>Freshly brewed.<br/>Everyday kopi.</blockquote><p>A fresh expression of Pakopi’s published mission</p></section>
 <section className="story-chapters section" data-reveal>
 <article><span>The idea</span><h2>A cup for the everyday.</h2><p>Good coffee and tea need not be reserved for a special occasion. Pakopi’s stated focus on fresh brewing and reasonable prices gives this concept its direction.</p></article>
 <article><span>The places</span><h2>Beyond one neighbourhood.</h2><p>Pakopi is documented in both Sabah and the Klang Valley. Its Taman Desa ordering page lists a Kuala Lumpur location; historical merchant records also list Uptown in Selangor and Kepong in Kuala Lumpur.</p></article>
 <article><span>Your pickup</span><h2>Find your familiar favourite.</h2><p>This preview brings Sadong Jaya, Damai and Inanam into one pickup journey. These three demo branches are a selected starting point, not the full network.</p></article>
 </section>
 <section className="section"><p>The founder, first outlet and meaning behind the year in the logo have not been independently verified. We have left those details out rather than invent a founding story.</p><p>Brand reference: <a href="https://pakopi.orderla.my/menu" target="_blank" rel="noreferrer">Pakopi Taman Desa’s published mission</a>. Historical locations: <a href="https://www.maybank2u.com.my/iwov-resources/pdf/personal/promotions/2022/FB_merchant-list.pdf" target="_blank" rel="noreferrer">Maybank merchant directory</a>. Listing history does not confirm every outlet is currently operating.</p></section>
 <section className="closing-cta"><p>Make time for your next cup.</p><h2>Your kopi.<br/>Your everyday pause.</h2><Link className="button gold" href="/stores">Explore pickup branches</Link></section>
 </main>;
}
`);
fs.appendFileSync('docs/content-register.md',`\n## Brand research update — 12 September 2026\n\nPakopi is not Sabah-only. The Taman Desa merchant ordering page lists Jalan 2/109f, Taman Danau Desa, Kuala Lumpur, and states a mission of freshly brewed coffee and tea at reasonable prices: https://pakopi.orderla.my/menu . This is a branch source, not evidence of a central corporate website.\n\nMaybank’s 2022 merchant directory lists PAKOPI @ UPTOWN in Damansara Utama, Selangor: https://www.maybank2u.com.my/iwov-resources/pdf/personal/promotions/2022/FB_merchant-list.pdf . Another merchant document lists Pakopi @ Kepong, Kuala Lumpur: https://www.maybank2u.com.my/iwov-resources/pdf/upload/ttw-emadani-merchants.pdf . These support historical presence outside Sabah, not a complete current outlet count. A July 2022 customer account describes a Pakopi drinks truck in Taman Desa: https://muntalksfood.blogspot.com/2022/07/braised-minced-meat-gravy.html .\n\nFounder, birthplace, first outlet, franchise structure and the meaning of 1969 remain unverified. CTOS lists a particular PAKOPI 1969 JHR ENTERPRISE registered in Selangor in 2022; this is not used as the founding date of the overall brand. Pakopi.com is an unrelated party-goods business and is not linked.\n\nThe new tagline “Freshly brewed. Everyday kopi.” and description are original proposed copy inspired by the published mission, not an official quotation. The About page describes the mission and documented geography without fabricating a founding story. Ordering remains limited to the original three selected Sabah demo branches.\n`);
