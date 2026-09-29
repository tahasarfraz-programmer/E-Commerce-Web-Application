import {Router} from 'express'; import {z} from 'zod'; import {pool} from '../config/db.js'; import {auth, wrap} from '../middleware/auth.js';
const r = Router(); r.use(auth);
const bad = (m, status = 409) => Object.assign(new Error(m), {status});
const items = z.array(z.object({id: z.number().int(), quantity: z.number().int().min(1).max(20)})).min(1);
const coupon = z.string().trim().toUpperCase().max(30).optional();
const order = z.object({items, coupon, name: z.string().min(2), address: z.string().min(4), city: z.string().min(2), postal: z.string().min(3)});
// Prices, stock and coupon rules always come from the database, never from the browser.
async function priceCart(c, list, code, lock) {
  const L = lock ? ' FOR UPDATE' : ''; let sub = 0; const lines = [];
  for (const it of list) {
    const [[p]] = await c.query(`SELECT id,name,price,stock FROM products WHERE id=?${L}`, [it.id]);
    if (!p || p.stock < it.quantity) throw bad(`${p ? p.name : 'An item'} is out of stock in that quantity.`);
    sub += p.price * it.quantity; lines.push([p, it.quantity]);
  }
  sub = +sub.toFixed(2); let discount = 0, applied = null;
  if (code) {
    const [[cp]] = await c.query(`SELECT * FROM coupons WHERE code=? AND active=TRUE AND (expires_at IS NULL OR expires_at>=CURDATE()) AND (max_uses IS NULL OR used_count<max_uses)${L}`, [code]);
    if (!cp) throw bad('That coupon code isn’t valid or has expired.');
    if (sub < cp.min_subtotal) throw bad(`This coupon needs a subtotal of at least $${cp.min_subtotal}.`);
    discount = +(sub * cp.percent_off / 100).toFixed(2); applied = cp.code;
  }
  const after = +(sub - discount).toFixed(2), shipping = after >= 150 ? 0 : 9.5;
  return {lines, sub, discount, coupon: applied, shipping, total: +(after + shipping).toFixed(2)};
}
const fail = (e, res) => { if (e.status) return res.status(e.status).json({error: e.message}); throw e; };
r.post('/quote', wrap(async (req, res) => {
  const d = z.object({items, coupon}).safeParse(req.body); if (!d.success) return res.status(400).json({error: 'Check your cart.'});
  try { const q = await priceCart(pool, d.data.items, d.data.coupon, false); res.json({subtotal: q.sub, discount: q.discount, shipping: q.shipping, total: q.total, coupon: q.coupon}); } catch (e) { fail(e, res); }
}));
r.post('/', wrap(async (req, res) => {
  const d = order.safeParse(req.body); if (!d.success) return res.status(400).json({error: 'Check your shipping details and cart.'});
  const c = await pool.getConnection();
  try {
    await c.beginTransaction(); const q = await priceCart(c, d.data.items, d.data.coupon, true);
    const [o] = await c.query('INSERT INTO orders(user_id,subtotal,discount,coupon_code,shipping,total,ship_name,ship_address,ship_city,ship_postal) VALUES(?,?,?,?,?,?,?,?,?,?)', [req.user.id, q.sub, q.discount, q.coupon, q.shipping, q.total, d.data.name, d.data.address, d.data.city, d.data.postal]);
    for (const [p, n] of q.lines) { await c.query('INSERT INTO order_items(order_id,product_id,name,price,quantity) VALUES(?,?,?,?,?)', [o.insertId, p.id, p.name, p.price, n]); await c.query('UPDATE products SET stock=stock-? WHERE id=?', [n, p.id]); }
    if (q.coupon) await c.query('UPDATE coupons SET used_count=used_count+1 WHERE code=?', [q.coupon]);
    await c.commit(); res.status(201).json({id: o.insertId, total: q.total});
  } catch (e) { await c.rollback(); fail(e, res); } finally { c.release(); }
}));
r.get('/', wrap(async (req, res) => {
  const [o] = await pool.query('SELECT * FROM orders WHERE user_id=? ORDER BY id DESC', [req.user.id]);
  for (const x of o) { [x.items] = await pool.query('SELECT name,price,quantity FROM order_items WHERE order_id=?', [x.id]); }
  res.json(o);
}));
export default r;
