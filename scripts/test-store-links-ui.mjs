import {chromium} from '@playwright/test';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const accounts=JSON.parse(fs.readFileSync('.demo/cloud-accounts.json','utf8'));
const account=accounts.find(a=>a.role==='global_admin');
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  await page.goto('http://localhost:5174/');
  await page.locator('input[type=email]').fill(account.email);
  await page.locator('input[type=password]').fill(account.password);
  await page.locator('form button[type=submit], form button.primary-button, form button:not([type])').last().click();
  await page.locator('input[type=password]').waitFor({state:'hidden',timeout:30000});
  await page.getByRole('button',{name:'Stores',exact:true}).click();
  await page.locator('.store-master-list button').filter({hasText:'Prima Sandakan'}).click();
  const share='https://maps.app.goo.gl/51SgmiWqKn1E9wUa8';
  await page.getByLabel('Shop link for Directions').fill(share);
  await page.getByRole('button',{name:'Get distance location'}).click();
  await page.getByText('Branch location found. Save the store to apply it.').waitFor({timeout:30000});
  assert.equal(await page.getByRole('link',{name:'Preview shop link'}).getAttribute('href'),share);
  // Intercept the write so this UI test never changes live branch records.
  let payload;
  await page.route('**/rest/v1/stores?*',async route=>{
    if(route.request().method()==='PATCH'){
      payload=route.request().postDataJSON();
      await route.fulfill({status:204});
    }else await route.continue();
  });
  await page.getByRole('button',{name:'Save store',exact:true}).click();
  await page.getByRole('button',{name:'Saved',exact:true}).waitFor();
  assert.equal(payload.maps_url,share);
  assert.equal(payload.latitude,5.8580692);
  assert.equal(payload.longitude,118.0739079);
  assert.equal(typeof payload.phone,'string');
  await page.locator('.store-location').scrollIntoViewIfNeeded();
  fs.mkdirSync('artifacts/store-links',{recursive:true});
  await page.screenshot({path:'artifacts/store-links/admin-desktop.png'});
  await page.setViewportSize({width:390,height:844});
  await page.locator('.store-location').scrollIntoViewIfNeeded();
  await page.screenshot({path:'artifacts/store-links/admin-mobile.png'});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false);
  console.log('PASS: actual short-link resolution, preview href, save payload includes exact link + coordinates, non-null phone, mobile no overflow. Write intercepted; live records unchanged.');
} finally {await browser.close();}
