import {chromium} from '@playwright/test';
import fs from 'node:fs';
const browser=await chromium.launch({channel:'chrome',headless:true});
const errors=[];const checks=[];
const url='http://localhost:3000/design-preview/index.html';
for(const width of [1440,390]){
 const page=await browser.newPage({viewport:{width,height:width===390?844:1000},reducedMotion:'reduce'});
 page.on('pageerror',e=>errors.push(e.message));
 for(const route of ['home','menu','order']){
  await page.goto(`${url}#${route}`);await page.locator('main').waitFor();await page.evaluate(()=>document.fonts.ready);
  await page.evaluate(async()=>{const imgs=[...document.images];imgs.forEach(i=>i.loading='eager');await Promise.all(imgs.map(i=>i.decode().catch(()=>{})));});
  await page.screenshot({path:`artifacts/classic-${route}-${width}.png`,fullPage:true});
  await page.screenshot({path:`artifacts/classic-${route}-${width}-top.png`});
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))errors.push(`Overflow ${route} ${width}`);
  if(await page.locator('img').evaluateAll(imgs=>imgs.some(i=>!i.complete||!i.naturalWidth)))errors.push(`Image failure ${route} ${width}`);
  checks.push(`${route} at ${width}px`);
 }
 await page.getByRole('button',{name:'Add',exact:true}).first().click();
 await page.getByLabel('Less sugar',{exact:true}).check();
 await page.getByRole('button',{name:/Add to order/}).click();
 await page.getByRole('button',{name:'Change branch'}).click();
 await page.locator('[data-switch="2"]').click();
 await page.getByRole('button',{name:'Keep my order'}).click();
 if(!await page.locator('.branch-select').innerText().then(s=>s.includes('Sadong Jaya')))errors.push('Cancel changed branch');
 await page.getByRole('button',{name:'Change branch'}).click();await page.locator('[data-switch="2"]').click();
 await page.getByRole('button',{name:'Clear & switch'}).click();
 await page.getByRole('searchbox').fill('Caramel');
 if(!await page.locator('#order-results').innerText().then(s=>s.includes('Caramel')))errors.push('Search failed');
 await page.getByRole('searchbox').fill('no such drink');
 if(!await page.locator('#order-results').innerText().then(s=>s.includes('No drinks found')))errors.push('Empty search failed');
 await page.getByRole('searchbox').fill('');
 await page.getByRole('button',{name:'Add',exact:true}).first().click();await page.getByRole('button',{name:/Add to order/}).click();
 if(width===390)await page.getByRole('button',{name:/View order/}).click();
 await page.getByRole('button',{name:'Review pickup order'}).last().click();
 await page.getByRole('heading',{name:'One last look.'}).waitFor();
 await page.screenshot({path:`artifacts/classic-review-${width}.png`});
 checks.push(`Cart, customisation, branch cancellation/confirmation, search, review at ${width}px`);
 await page.close();
}
await browser.close();
function lum(hex){const c=hex.match(/\w\w/g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722;}
const contrasts=[['35251d','fff8e9'],['705b4b','fff8e9'],['fff8e9','563726'],['35251d','efd064'],['705b4b','f1e6d2']].map(([a,b])=>({pair:[a,b],ratio:(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05)}));
contrasts.forEach(c=>{if(c.ratio<4.5)errors.push(`Contrast ${c.pair}`);});
fs.writeFileSync('artifacts/classic-preview-checks.json',JSON.stringify({checks,contrasts,errors},null,2));console.log(JSON.stringify({checks,contrasts,errors},null,2));if(errors.length)process.exitCode=1;
