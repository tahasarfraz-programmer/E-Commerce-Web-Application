import bcrypt from 'bcryptjs'; import {pool as db} from '../config/db.js';
const pool=await db.getConnection(); // one connection so FOREIGN_KEY_CHECKS applies to every statement
if(process.env.NODE_ENV==='production'&&!process.env.SEED_ALLOW_PRODUCTION){console.error('Refusing to seed in production: it wipes all data.');process.exit(1)}
const cats=[['Vessels','vessels'],['Lighting','lighting'],['Textiles','textiles'],['Tableware','tableware']];
const brands=['Kiln & Co','Lumen Works','Nordweave','Studio Ashe'];
const P=[
['Tall Ridge Vase','Hand-thrown stoneware with a matte glaze and a ridged neck.',68,null,1,1,24,'#2F5D50','New',4.8,42],
['Low Bowl, Ash','A wide serving bowl fired twice for a soft, speckled finish.',54,72,1,4,18,'#8A9A8E','Sale',4.6,31],
['Arc Table Lamp','Brushed brass arm and a mouth-blown opal shade.',189,null,2,2,9,'#C9A227','Best seller',4.9,88],
['Pebble Pendant','Ceramic pendant light with a warm 2700K glow.',149,179,2,2,4,'#B9B2A0','Low stock',4.5,19],
['Linen Throw, Moss','Stonewashed European linen, 130 x 180 cm.',96,null,3,3,30,'#5B6F4F',null,4.7,57],
['Wool Cushion, Slate','Woven wool cover with a feather insert.',78,null,3,3,22,'#46505C','New',4.4,14],
['Dinner Plate Set of 4','Reactive-glaze stoneware, dishwasher safe.',112,140,4,1,15,'#3D6B7A','Sale',4.8,73],
['Stem Carafe','Recycled glass carafe with a cork stopper.',44,null,4,4,40,'#7FA89B',null,4.3,26]];
await pool.query('SET FOREIGN_KEY_CHECKS=0');for(const t of ['banners','coupons','user_tokens','wishlist_items','addresses','audit_log','order_items','orders','reviews','products','brands','categories','users'])await pool.query(`TRUNCATE ${t}`);await pool.query('SET FOREIGN_KEY_CHECKS=1');
for(const [n,s] of cats)await pool.query('INSERT INTO categories(name,slug) VALUES(?,?)',[n,s]);
for(const b of brands)await pool.query('INSERT INTO brands(name) VALUES(?)',[b]);
for(const p of P)await pool.query('INSERT INTO products(name,description,price,compare_at,category_id,brand_id,stock,color,badge,rating,reviews_count) VALUES(?)',[p]);
import {randomBytes} from 'node:crypto';
await pool.query("INSERT INTO coupons(code,percent_off,min_subtotal) VALUES('WELCOME10',10,0),('STUDIO20',20,100)");
await pool.query("INSERT INTO banners(title,subtitle,link,sort_order) VALUES('Two-week studio sale','Use code WELCOME10 for 10% off your first order.','/shop?sort=price_asc',1)");
const rnd=()=>randomBytes(12).toString('base64url').replace(/[-_]/g,'x')+'7a';
const creds=[['Admin','admin@atelier.test',process.env.SEED_ADMIN_PASSWORD||rnd(),'admin'],['Demo Customer','customer@atelier.test',process.env.SEED_CUSTOMER_PASSWORD||rnd(),'customer']];
for(const [n,e,pw,r] of creds) await pool.query('INSERT INTO users(name,email,password_hash,role,email_verified_at) VALUES(?,?,?,?,NOW())',[n,e,await bcrypt.hash(pw,12),r]);
console.log('Seeded. Sign-in details (shown once):');for(const [,e,pw] of creds)console.log(`  ${e}  ${pw}`);process.exit(0);
