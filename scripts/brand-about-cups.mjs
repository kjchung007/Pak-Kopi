import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(fs.realpathSync('apps/web/node_modules/next/package.json'));
const sharp = require('sharp');
const dir = 'apps/web/public/brand/';
// Preserve the supplied logo's actual linework; gold becomes transparent ink gaps.
const {data,info} = await sharp(dir+'pakopi-logo.png').ensureAlpha().raw().toBuffer({resolveWithObject:true});
for(let i=0;i<data.length;i+=4){
  const ink=1-Math.min(1,Math.max(data[i]/190,data[i+1]/170,data[i+2]/95));
  data[i+3]=Math.round(data[i+3]*ink*.92);
  data[i]=data[i+1]=data[i+2]=12;
}
const logo=await sharp(data,{raw:info}).png().toBuffer();
const meta=await sharp(dir+'about-wide-clean.png').metadata();
const scale=meta.width/1672;
const placements=[[530,601,80,90],[631,718,82,90],[773,635,83,94],[988,702,81,94]];
const layers=await Promise.all(placements.map(async([x,y,w,h])=>({input:await sharp(logo).resize(Math.round(w*scale),Math.round(h*scale),{fit:'fill'}).png().toBuffer(),left:Math.round(x*scale),top:Math.round(y*scale)})));
await sharp(dir+'about-wide-clean.png').composite(layers).webp({quality:94}).toFile(dir+'about-wide-branded.webp');
console.log('Saved About artwork with original logo linework.');
