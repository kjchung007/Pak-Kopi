import {chromium} from '@playwright/test';
import fs from 'node:fs';
const host=process.argv[2]||'192.168.0.148';
const b=await chromium.launch({channel:'chrome',headless:true});const errors=[];const checks=[];
for(const width of [390,1440]){
 const p=await b.newPage({viewport:{width,height:900},reducedMotion:'reduce'});p.on('pageerror',e=>errors.push(e.message));
 for(const route of ['/','/menu','/story','/stores']){
  const response=await p.goto(`http://${host}:3000${route}`,{waitUntil:'networkidle',timeout:45000});
  if(response.status()!==200)errors.push(`${route}: ${response.status()}`);
  await p.screenshot({path:`artifacts/restored-web-${route.replaceAll('/','')||'home'}-${width}.png`});
  if(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2))errors.push(`Overflow ${route} ${width}`);
  if(await p.locator(`a[href*="localhost:5173"]`).count())errors.push(`Loopback ordering link ${route}`);
  if(!await p.locator(`a[href^="http://${host}:5173"]`).count())errors.push(`Missing LAN ordering link ${route}`);
 }
 await p.goto(`http://${host}:5173`,{waitUntil:'networkidle',timeout:45000});
 await p.getByRole('button',{name:/Choose pickup store/}).waitFor();await p.screenshot({path:`artifacts/restored-order-home-${width}.png`});
 await p.getByRole('button',{name:/Choose pickup store/}).click();await p.getByRole('button',{name:/Sadong Jaya/}).click();await p.getByRole('button',{name:'Menu',exact:true}).click();await p.locator('.product').first().waitFor();
 await p.screenshot({path:`artifacts/restored-order-menu-${width}.png`});
 if(!await p.locator('.product-copy p').first().isVisible())errors.push('Original product descriptions missing');
 if(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2))errors.push(`Order overflow ${width}`);
 checks.push(`LAN website all four pages, cross-app links and live branch menu at ${width}px`);
 await p.close();
}
await b.close();fs.writeFileSync('artifacts/restored-network-checks.json',JSON.stringify({host,checks,errors},null,2));console.log(JSON.stringify({host,checks,errors},null,2));if(errors.length)process.exitCode=1;
