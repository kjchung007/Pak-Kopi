import fs from 'node:fs';
import {openDemoDatabase} from './demo-db.mjs';
try{const response=await fetch('http://127.0.0.1:54321/health',{signal:AbortSignal.timeout(1500)});if(response.ok)throw Error('Stop the demo backend before resetting its database.');}catch(e){if(e.message.startsWith('Stop'))throw e;}
const db=await openDemoDatabase('.demo/database');
if(!(await db.query('select enabled from private.demo_settings')).rows[0]?.enabled)throw Error('This is not an enabled demo database');
await db.exec('begin');
try{await db.exec('truncate public.orders,public.customer_cart_items restart identity cascade;update private.store_order_sequences set last_value=0;update public.products set sold=0;update public.reward_accounts set points_balance=0,stamp_count=0,lifetime_points=0;');await db.exec(fs.readFileSync('supabase/seed.sql','utf8'));await db.exec('commit');}catch(e){await db.exec('rollback');throw e}finally{await db.close()}
console.log('Demo orders, carts and balances reset; logins and content retained.');
