import fs from 'node:fs';import {createRequire} from 'node:module';
const require=createRequire(fs.realpathSync('apps/web/node_modules/next/package.json'));const sharp=require('sharp');
// Pixel resampling and unsharp masking only: no generated/replaced artwork.
await sharp('images/About Pak kopi hero.webp').resize({width:1536,kernel:'lanczos3'}).sharpen({sigma:0.7,m1:0.5,m2:1.2}).webp({quality:95}).toFile('apps/web/public/brand/about-original-sharpened.webp');
const f='packages/brand/brand.json';const b=JSON.parse(fs.readFileSync(f));b.aboutHeroImage='/brand/about-original-sharpened.webp';fs.writeFileSync(f,JSON.stringify(b,null,2)+'\n');
let s=fs.readFileSync('apps/web/src/components/SiteChrome.tsx','utf8').replace('className="site-header home-header"','className={`site-header home-header${path === "/story" ? " about-overlay-header" : ""}`}');fs.writeFileSync('apps/web/src/components/SiteChrome.tsx',s);
s=fs.readFileSync('apps/web/src/app/story/page.tsx','utf8').replace('Enhanced miniature Pak Kopi coffee truck and drinks scene','Original Pak Kopi coffee truck and drinks artwork, lightly sharpened');fs.writeFileSync('apps/web/src/app/story/page.tsx',s);
