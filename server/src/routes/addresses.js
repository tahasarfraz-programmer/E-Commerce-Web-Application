import {Router} from 'express'; import {z} from 'zod'; import {pool} from '../config/db.js'; import {auth, wrap} from '../middleware/auth.js';
const r = Router(); r.use(auth);
const A = z.object({label: z.string().trim().max(40).default('Home'), name: z.string().trim().min(2).max(100), line1: z.string().trim().min(4).max(200), city: z.string().trim().min(2).max(80), postal: z.string().trim().min(3).max(20), is_default: z.boolean().default(false)});
const F = ['label', 'name', 'line1', 'city', 'postal', 'is_default'];
r.get('/', wrap(async (req, res) => { const [a] = await pool.query('SELECT * FROM addresses WHERE user_id=? ORDER BY is_default DESC,id DESC', [req.user.id]); res.json(a.map(x => ({...x, is_default: !!x.is_default}))); }));
r.post('/', wrap(async (req, res) => {
  const d = A.safeParse(req.body); if (!d.success) return res.status(400).json({error: 'Fill in name, street address, city and postal code.'});
  const [[{n}]] = await pool.query('SELECT COUNT(*) n FROM addresses WHERE user_id=?', [req.user.id]);
  if (n >= 10) return res.status(409).json({error: 'You can save up to 10 addresses. Delete one first.'});
  const def = d.data.is_default || n === 0; if (def) await pool.query('UPDATE addresses SET is_default=FALSE WHERE user_id=?', [req.user.id]);
  const [i] = await pool.query('INSERT INTO addresses(user_id,label,name,line1,city,postal,is_default) VALUES(?,?,?,?,?,?,?)', [req.user.id, d.data.label, d.data.name, d.data.line1, d.data.city, d.data.postal, def]);
  res.status(201).json({id: i.insertId});
}));
r.put('/:id', wrap(async (req, res) => {
  const d = A.safeParse(req.body); if (!d.success) return res.status(400).json({error: 'Fill in name, street address, city and postal code.'});
  if (d.data.is_default) await pool.query('UPDATE addresses SET is_default=FALSE WHERE user_id=?', [req.user.id]);
  const [u] = await pool.query(`UPDATE addresses SET ${F.map(k => k + '=?')} WHERE id=? AND user_id=?`, [...F.map(k => d.data[k]), +req.params.id, req.user.id]);
  u.affectedRows ? res.json({ok: true}) : res.status(404).json({error: 'Address not found.'});
}));
r.delete('/:id', wrap(async (req, res) => { await pool.query('DELETE FROM addresses WHERE id=? AND user_id=?', [+req.params.id, req.user.id]); res.json({ok: true}); }));
export default r;
