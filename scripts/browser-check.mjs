import {chromium} from '@playwright/test';
import fs from 'node:fs';
fs.mkdirSync('artifacts',{recursive:true});
const accounts=JSON.parse(fs.readFileSync(process.argv.includes('--cloud')?'.demo/cloud-accounts.json':'.demo/accounts.json'));
const browser=await chromium.launch({channel:'chrome',headless:true});
const failures=[];
for(const [app,port,size,role] of [['web',3000,{width:1440,height:1000},null],['web-mobile',3000,{width:390,height:844},null],['order',5173,{width:390,height:844},null],['admin',5174,{width:1440,height:1000},'global_admin'],['staff',5175,{width:1280,height:900},'staff'],['board',5175,{width:1440,height:900},null]]){
 const page=await browser.newPage({viewport:size,reducedMotion:'reduce'});
 page.on('pageerror',e=>failures.push({app,error:e.message}));
 page.on('requestfailed',r=>{if(r.url().includes('54321'))failures.push({app,error:r.failure()?.errorText,url:r.url()})});
 page.on('response',r=>{if(r.status()>=400&&!r.url().includes('fonts.googleapis'))failures.push({app,status:r.status(),url:r.url()})});
 try{
 await page.goto(`http://localhost:${port}${app==='board'?'/board/1':''}`,{waitUntil:'networkidle',timeout:60000});
 if(role){const a=accounts.find(a=>a.role===role);await page.locator('input[type=email]').fill(a.email);await page.locator('input[type=password]').fill(a.password);await page.locator('form button[type=submit], form button.primary-button, form button:not([type])').last().click();await page.locator('input[type=password]').waitFor({state:'hidden',timeout:20000});await page.waitForTimeout(1500);}
 await page.screenshot({path:`artifacts/${app}.png`,fullPage:app.startsWith('web')});
 if(app==='web')await page.screenshot({path:'artifacts/web-desktop-top.png'});
 fs.writeFileSync(`artifacts/${app}.txt`,await page.locator('body').innerText());
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2))failures.push({app,error:'Horizontal overflow'});
 console.log('Captured',app);
 }catch(e){failures.push({app,error:e.message});}finally{await page.close()}
}
await browser.close();fs.writeFileSync('artifacts/browser-results.json',JSON.stringify(failures,null,2));console.log(JSON.stringify(failures,null,2));

