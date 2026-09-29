import {Router} from 'express'; import {z} from 'zod'; import {pool} from '../config/db.js'; import {auth,admin,wrap} from '../middleware/auth.js'; import {audit} from '../utils/audit.js';
const r=Router(); r.use(auth,admin);
const P=z.object({name:z.string().min(2),description:z.string().default(''),price:z.coerce.number().positive(),compare_at:z.coerce.number().positive().nullable().optional(),category_id:z.coerce.number().int(),brand_id:z.coerce.number().int(),stock:z.coerce.number().int().min(0),color:z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#1F3A32'),badge:z.string().max(30).nullable().optional()});
const F=['name','description','price','compare_at','category_id','brand_id','stock','color','badge'];
r.post('/products',wrap(async(req,res)=>{const d=P.safeParse(req.body);if(!d.success)return res.status(400).json({error:'Some product fields are invalid.'});
  const [i]=await pool.query(`INSERT INTO products(${F}) VALUES(?)`,[F.map(k=>d.data[k]??null)]);audit(req,req.user.id,'product.create',i.insertId);res.status(201).json({id:i.insertId});}));
r.put('/products/:id',wrap(async(req,res)=>{const d=P.safeParse(req.body);if(!d.success)return res.status(400).json({error:'Some product fields are invalid.'});
  await pool.query(`UPDATE products SET ${F.map(k=>k+'=?')} WHERE id=?`,[...F.map(k=>d.data[k]??null),+req.params.id]);audit(req,req.user.id,'product.update',req.params.id);res.json({ok:true});}));
r.delete('/products/:id',wrap(async(req,res)=>{
  try{await pool.query('DELETE FROM products WHERE id=?',[+req.params.id]);audit(req,req.user.id,'product.delete',req.params.id);res.json({ok:true});}
  catch{res.status(409).json({error:'This product is in past orders. Set its stock to 0 instead.'});}}));
r.get('/orders',wrap(async(_q,res)=>{const [o]=await pool.query('SELECT o.*,u.name customer FROM orders o JOIN users u ON u.id=o.user_id ORDER BY o.id DESC LIMIT 100');res.json(o);}));
r.patch('/orders/:id',wrap(async(req,res)=>{
  if(!['pending','paid','shipped','delivered','cancelled'].includes(req.body.status))return res.status(400).json({error:'Invalid status.'});
  await pool.query('UPDATE orders SET status=? WHERE id=?',[req.body.status,+req.params.id]);audit(req,req.user.id,'order.status',req.params.id+' -> '+req.body.status);res.json({ok:true});}));
r.get('/analytics',wrap(async(_q,res)=>{
  const [[s]]=await pool.query("SELECT COALESCE(SUM(CASE WHEN status<>'cancelled' THEN total END),0) revenue,COUNT(*) orders,COALESCE(SUM(status='pending'),0) pending FROM orders");
  const [[c]]=await pool.query("SELECT COUNT(*) customers FROM users WHERE role='customer'");
  const [[l]]=await pool.query('SELECT COUNT(*) low_stock FROM products WHERE stock<=5');
  const [top]=await pool.query('SELECT name,SUM(quantity) sold FROM order_items GROUP BY product_id,name ORDER BY sold DESC LIMIT 5');
  const [daily]=await pool.query("SELECT DATE_FORMAT(MIN(created_at),'%m-%d') d,SUM(total) revenue,COUNT(*) orders FROM orders WHERE status<>'cancelled' AND created_at>=DATE_SUB(CURDATE(), INTERVAL 13 DAY) GROUP BY DATE(created_at) ORDER BY DATE(created_at)");
  const [cats]=await pool.query("SELECT c.name,SUM(oi.price*oi.quantity) revenue FROM order_items oi JOIN products p ON p.id=oi.product_id JOIN categories c ON c.id=p.category_id JOIN orders o ON o.id=oi.order_id WHERE o.status<>'cancelled' GROUP BY c.id,c.name ORDER BY revenue DESC");
  res.json({...s,...c,...l,top,daily,cats});}));
const bool = z.any().transform(v => !!v);
const RES = {
  categories: {t: 'categories', f: ['name', 'slug'], s: z.object({name: z.string().trim().min(2).max(80), slug: z.string().trim().regex(/^[a-z0-9-]{2,80}$/, 'use lowercase letters, numbers and dashes')})},
  brands: {t: 'brands', f: ['name'], s: z.object({name: z.string().trim().min(2).max(80)})},
  banners: {t: 'banners', f: ['title', 'subtitle', 'link', 'active', 'sort_order'], s: z.object({title: z.string().trim().min(2).max(120), subtitle: z.string().trim().max(200).default(''), link: z.string().trim().regex(/^\/[\w\-\/?=&.]*$/, 'must start with /').default('/shop'), active: bool, sort_order: z.coerce.number().int().default(0)})},
  coupons: {t: 'coupons', f: ['code', 'percent_off', 'min_subtotal', 'max_uses', 'expires_at', 'active'],
    list: "SELECT id,code,percent_off,min_subtotal,max_uses,used_count,active,DATE_FORMAT(expires_at,'%Y-%m-%d') expires_at FROM coupons ORDER BY id DESC",
    s: z.object({code: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{3,30}$/, '3-30 letters or numbers'), percent_off: z.coerce.number().int().min(1).max(90), min_subtotal: z.coerce.number().min(0).default(0),
      max_uses: z.preprocess(v => v === '' || v == null ? null : v, z.coerce.number().int().min(1).nullable()), expires_at: z.preprocess(v => v || null, z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable()), active: bool})}
};
const problem = d => `${d.error.issues[0].path[0] ?? 'form'}: ${d.error.issues[0].message}`;
for (const [name, {t, f, s, list}] of Object.entries(RES)) { // table and column names are constants above, never user input
  r.get(`/${name}`, wrap(async (_q, res) => { const [x] = await pool.query(list || `SELECT * FROM ${t} ORDER BY id DESC`); res.json(x); }));
  r.post(`/${name}`, wrap(async (req, res) => {
    const d = s.safeParse(req.body); if (!d.success) return res.status(400).json({error: problem(d)});
    try { const [i] = await pool.query(`INSERT INTO ${t}(${f}) VALUES(?)`, [f.map(k => d.data[k] ?? null)]); audit(req, req.user.id, name + '.create', i.insertId); res.status(201).json({id: i.insertId}); }
    catch (e) { if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({error: 'That name or code already exists.'}); throw e; }
  }));
  r.put(`/${name}/:id`, wrap(async (req, res) => {
    const d = s.safeParse(req.body); if (!d.success) return res.status(400).json({error: problem(d)});
    try { await pool.query(`UPDATE ${t} SET ${f.map(k => k + '=?')} WHERE id=?`, [...f.map(k => d.data[k] ?? null), +req.params.id]); audit(req, req.user.id, name + '.update', req.params.id); res.json({ok: true}); }
    catch (e) { if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({error: 'That name or code already exists.'}); throw e; }
  }));
  r.delete(`/${name}/:id`, wrap(async (req, res) => {
    try { await pool.query(`DELETE FROM ${t} WHERE id=?`, [+req.params.id]); audit(req, req.user.id, name + '.delete', req.params.id); res.json({ok: true}); }
    catch { res.status(409).json({error: 'This item is still in use by products. Move or remove those first.'}); }
  }));
}
r.get('/customers', wrap(async (_q, res) => {
  const [x] = await pool.query("SELECT u.id,u.name,u.email,u.role,u.email_verified_at,u.created_at,COUNT(o.id) orders,COALESCE(SUM(o.total),0) spent FROM users u LEFT JOIN orders o ON o.user_id=u.id AND o.status<>'cancelled' GROUP BY u.id ORDER BY u.id DESC LIMIT 200"); res.json(x);
}));
r.get('/reviews', wrap(async (_q, res) => {
  const [x] = await pool.query('SELECT rv.id,p.name product,u.name customer,rv.rating,rv.body,rv.created_at FROM reviews rv JOIN products p ON p.id=rv.product_id JOIN users u ON u.id=rv.user_id ORDER BY rv.id DESC LIMIT 200'); res.json(x);
}));
r.delete('/reviews/:id', wrap(async (req, res) => {
  const [[rv]] = await pool.query('SELECT product_id,rating FROM reviews WHERE id=?', [+req.params.id]); if (!rv) return res.status(404).json({error: 'Review not found.'});
  await pool.query('DELETE FROM reviews WHERE id=?', [+req.params.id]);
  await pool.query('UPDATE products SET rating=IF(reviews_count>1,ROUND((rating*reviews_count-?)/(reviews_count-1),1),0), reviews_count=GREATEST(reviews_count-1,0) WHERE id=?', [rv.rating, rv.product_id]);
  audit(req, req.user.id, 'review.delete', req.params.id); res.json({ok: true});
}));
export default r;
