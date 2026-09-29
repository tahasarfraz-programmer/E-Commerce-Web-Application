// Usage: with API (:4000) and client (:5173) running and DB seeded -> npm run screenshots
import {chromium} from 'playwright';
const base=process.env.URL||'http://localhost:5173', out='docs/screenshots';
const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:1440,height:900}}); const p=await ctx.newPage();
const shot=async(n,full=true)=>{await p.waitForTimeout(700);await p.screenshot({path:`${out}/${n}.png`,fullPage:full});console.log('saved',n)};
await p.goto(base);await p.waitForSelector('.card');await shot('home');
await p.goto(base+'/shop');await p.waitForSelector('.card');await shot('shop');
await p.goto(base+'/product/3');await p.waitForSelector('.pdp h1');await shot('product',false);
await p.click('text=Add to cart');await p.goto(base+'/cart');await p.waitForSelector('.summary');await shot('cart',false);
await p.goto(base+'/login');await shot('login',false);
await p.fill('input[type=email]','admin@atelier.test');await p.fill('input[type=password]',process.env.ADMIN_PASSWORD);await p.click('button.btn');
await p.waitForURL('**/admin');await p.waitForSelector('.stats');await shot('admin-overview',false);
await ctx.close();
const m=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});const q=await m.newPage();
await q.goto(base);await q.waitForSelector('.card');await q.waitForTimeout(700);await q.screenshot({path:`${out}/home-mobile.png`});console.log('saved home-mobile');
await b.close();
