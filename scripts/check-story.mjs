import {chromium} from '@playwright/test';
import fs from 'node:fs';
const browser=await chromium.launch({channel:'chrome',headless:true});
for(const [name,width,height]of [['desktop',1440,1000],['mobile',390,844]]){
 const p=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});await p.goto('http://localhost:3000/story',{waitUntil:'networkidle'});
 if(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2))throw Error(name+' overflow');
 await p.screenshot({path:`artifacts/story-${name}.png`,fullPage:true});fs.writeFileSync(`artifacts/story-${name}.txt`,await p.locator('body').innerText());await p.close();
}
await browser.close();console.log('About page verified at desktop and mobile sizes.');
