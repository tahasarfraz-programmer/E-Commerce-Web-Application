import {Router} from 'express'; import {pool} from '../config/db.js'; import {wrap} from '../middleware/auth.js';
const r = Router();
r.get('/banners', wrap(async (_q, res) => { const [b] = await pool.query('SELECT id,title,subtitle,link FROM banners WHERE active=TRUE ORDER BY sort_order,id'); res.json(b); }));
export default r;
