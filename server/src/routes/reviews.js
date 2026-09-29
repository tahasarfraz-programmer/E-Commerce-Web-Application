import {Router} from 'express'; import {z} from 'zod'; import {pool} from '../config/db.js'; import {auth, wrap} from '../middleware/auth.js';
const r = Router(); r.use(auth);
const S = z.object({product_id: z.number().int(), rating: z.number().int().min(1).max(5), body: z.string().trim().max(1000).default('')});
r.post('/', wrap(async (req, res) => {
  const d = S.safeParse(req.body); if (!d.success) return res.status(400).json({error: 'Choose a rating from 1 to 5. Reviews can be up to 1000 characters.'});
  const [[u]] = await pool.query('SELECT email_verified_at FROM users WHERE id=?', [req.user.id]);
  if (!u.email_verified_at) return res.status(403).json({error: 'Verify your email before writing a review. Check Account → Profile.'});
  const [bought] = await pool.query("SELECT 1 FROM order_items oi JOIN orders o ON o.id=oi.order_id WHERE o.user_id=? AND oi.product_id=? AND o.status<>'cancelled' LIMIT 1", [req.user.id, d.data.product_id]);
  if (!bought.length) return res.status(403).json({error: 'Only customers who bought this product can review it.'});
  try { await pool.query('INSERT INTO reviews(product_id,user_id,rating,body) VALUES(?,?,?,?)', [d.data.product_id, req.user.id, d.data.rating, d.data.body]); }
  catch (e) { if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({error: 'You have already reviewed this product.'}); throw e; }
  await pool.query('UPDATE products SET rating=ROUND((rating*reviews_count+?)/(reviews_count+1),1), reviews_count=reviews_count+1 WHERE id=?', [d.data.rating, d.data.product_id]);
  res.status(201).json({ok: true});
}));
export default r;
