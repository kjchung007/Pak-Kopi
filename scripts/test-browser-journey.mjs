import {chromium} from '@playwright/test';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const catalog=JSON.parse(fs.readFileSync('packages/brand/catalog.json')); const escaped=s=>new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
const b=await chromium.launch({channel:'chrome',headless:true});const p=await b.newPage({viewport:{width:390,height:844}});
await p.goto('http://localhost:5173');await p.getByRole('button',{name:/Choose pickup store/}).click();await p.getByRole('button',{name:escaped(catalog.stores[0].name)}).click();await p.getByRole('button',{name:'Menu',exact:true}).click();await p.getByRole('button',{name:escaped(catalog.products[0].name)}).first().click();await p.getByRole('button',{name:/Add 1 to cart/}).click();
const account=JSON.parse(fs.readFileSync(process.argv.includes('--cloud')?'.demo/cloud-accounts.json':'.demo/accounts.json')).find(a=>a.role==='customer');await p.locator('input[type=email]').fill(account.email);await p.locator('input[type=password]').fill(account.password);await p.locator('form').getByRole('button',{name:'Sign in',exact:true}).click();
await p.getByRole('button',{name:/View cart/}).click();
const payment=p.waitForResponse(r=>r.url().endsWith('/rpc/complete_demo_payment'));
await p.getByRole('button',{name:/Simulate payment/}).click();const response=await payment;const order=await response.json();assert.equal(response.status(),200,JSON.stringify(order));assert.equal(order.payment_status,'paid');
await p.waitForTimeout(1800);assert(!(await p.locator('body').innerText()).includes('NaN'));await p.screenshot({path:'artifacts/customer-order.png'});
const staff=await b.newPage({viewport:{width:1280,height:900}});await staff.goto('http://localhost:5175');const accountStaff=JSON.parse(fs.readFileSync(process.argv.includes('--cloud')?'.demo/cloud-accounts.json':'.demo/accounts.json')).find(a=>a.role==='staff'&&a.store===1);
await staff.locator('input[type=email]').fill(accountStaff.email);await staff.locator('input[type=password]').fill(accountStaff.password);await staff.getByRole('button',{name:'Enter counter'}).click();await staff.getByRole('button',{name:/Live orders/}).click();
const card=staff.locator('.order-card').filter({hasText:order.order_number});await card.getByRole('button',{name:'Accept & prepare'}).click();await card.getByRole('button',{name:'Mark ready'}).click();
const board=await b.newPage({viewport:{width:1440,height:900}});await board.goto('http://localhost:5175/board/1');await board.getByText(order.order_number,{exact:true}).waitFor();await board.screenshot({path:'artifacts/board-ready.png'});await staff.screenshot({path:'artifacts/staff-ready.png'});
await card.getByRole('button',{name:'Picked up'}).click();await board.getByText(order.order_number,{exact:true}).waitFor({state:'hidden',timeout:10000});
await p.getByRole('button',{name:'Menu',exact:true}).click();await p.getByRole('button',{name:escaped(catalog.products[0].name)}).first().click();await p.getByRole('button',{name:/Add 1 to cart/}).click();await p.getByRole('button',{name:'Change',exact:true}).click();
p.once('dialog',d=>d.dismiss());await p.getByRole('button',{name:escaped(catalog.stores[1].name)}).click();assert(await p.getByRole('button',{name:/View cart/}).isVisible());
p.once('dialog',d=>d.accept());await p.getByRole('button',{name:escaped(catalog.stores[1].name)}).click();await p.getByRole('button',{name:/View cart/}).waitFor({state:'hidden'});await p.waitForTimeout(500);assert((await p.locator('body').innerText()).includes(catalog.stores[1].name));
console.log('PASS browser customer checkout, staff preparation/ready/collection, live board removal, and cart switch cancel/confirm');fs.writeFileSync('artifacts/journey-result.json',JSON.stringify({passed:true,orderNumber:order.order_number}));await b.close();


