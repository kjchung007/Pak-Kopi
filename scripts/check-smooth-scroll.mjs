import {chromium} from '@playwright/test';import assert from 'node:assert/strict';import fs from 'node:fs';
const browser=await chromium.launch({channel:'chrome',headless:true});const results=[];
for(const reducedMotion of ['no-preference','reduce']){
 const p=await browser.newPage({viewport:{width:1440,height:900},reducedMotion});const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://localhost:3000/',{waitUntil:'networkidle'});await p.locator('html.lenis').waitFor();await p.mouse.move(650,450);await p.mouse.wheel(0,700);
 const samples=[];for(let i=0;i<10;i++){await p.waitForTimeout(100);samples.push(await p.evaluate(()=>scrollY));}assert(samples.at(-1)>600);assert(samples.at(-1)<710);
 if(reducedMotion==='no-preference'){assert(samples[0]<samples[3],'wheel must ease instead of jump');assert(samples[3]-samples[2]<samples[1]-samples[0],'motion must decelerate');}
 else assert(samples[0]>690,'reduced motion must not coast');
 await p.getByRole('navigation',{name:'Primary navigation'}).getByRole('link',{name:'Menu',exact:true}).click();await p.waitForURL('**/menu');await p.waitForTimeout(400);assert(await p.evaluate(()=>scrollY)<5,'route must not inherit momentum');await p.getByRole('link',{name:'Scroll to the drinks'}).click();await p.waitForTimeout(1800);assert(await p.evaluate(()=>scrollY)>300);assert.equal(errors.length,0,errors.join('\n'));results.push({reducedMotion,samples,anchors:true,navigation:true,errors});await p.close();
}
await browser.close();fs.writeFileSync('artifacts/smooth-scroll-checks.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results));
