import {Router} from 'express'; import {pool} from '../config/db.js'; import {auth, wrap} from '../middleware/auth.js';
const r = Router(); r.use(auth);
const add = (uid, id) => pool.query('INSERT IGNORE INTO wishlist_items(user_id,product_id) SELECT ?,id FROM products WHERE id=?', [uid, id]);
r.get('/', wrap(async (req, res) => { const [x] = await pool.query('SELECT product_id FROM wishlist_items WHERE user_id=?', [req.user.id]); res.json({ids: x.map(i => i.product_id)}); }));
r.put('/:id', wrap(async (req, res) => { await add(req.user.id, +req.params.id); res.json({ok: true}); }));
r.delete('/:id', wrap(async (req, res) => { await pool.query('DELETE FROM wishlist_items WHERE user_id=? AND product_id=?', [req.user.id, +req.params.id]); res.json({ok: true}); }));
r.post('/merge', wrap(async (req, res) => { // merges a guest's saved items after sign-in
  const ids = (Array.isArray(req.body?.ids) ? req.body.ids : []).map(Number).filter(n => Number.isInteger(n) && n > 0).slice(0, 100);
  for (const id of ids) await add(req.user.id, id); res.json({ok: true});
}));
export default r;
