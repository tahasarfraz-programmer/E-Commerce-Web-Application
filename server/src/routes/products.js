import {Router} from 'express'; import {pool} from '../config/db.js'; import {wrap} from '../middleware/auth.js';
const r=Router();
const SEL='SELECT p.*,c.name category,c.slug category_slug,b.name brand FROM products p JOIN categories c ON c.id=p.category_id JOIN brands b ON b.id=p.brand_id';
r.get('/',wrap(async(req,res)=>{
  const {q,category,brand,min,max,sort,ids,page=1,limit=12}=req.query; const w=[],a=[];
  if(q){w.push('(p.name LIKE ? OR b.name LIKE ? OR c.name LIKE ?)');a.push(...Array(3).fill(`%${q}%`));}
  if(category){w.push('c.slug=?');a.push(category);} if(brand){w.push('b.id=?');a.push(+brand);}
  const idl=String(ids||'').split(',').map(Number).filter(n=>Number.isInteger(n)&&n>0).slice(0,100);
  if(ids!==undefined){if(!idl.length)return res.json({items:[],total:0,page:1,pages:0});w.push('p.id IN (?)');a.push(idl);}
  if(min){w.push('p.price>=?');a.push(+min);} if(max){w.push('p.price<=?');a.push(+max);}
  const order={price_asc:'p.price ASC',price_desc:'p.price DESC',rating:'p.rating DESC',new:'p.created_at DESC'}[sort]||'p.id ASC';
  const where=w.length?' WHERE '+w.join(' AND '):''; const lim=Math.min(+limit||12,48), off=((+page||1)-1)*lim;
  const [[{n}]]=await pool.query(`SELECT COUNT(*) n FROM products p JOIN categories c ON c.id=p.category_id JOIN brands b ON b.id=p.brand_id${where}`,a);
  const [items]=await pool.query(`${SEL}${where} ORDER BY ${order} LIMIT ? OFFSET ?`,[...a,lim,off]);
  res.json({items,total:n,page:+page||1,pages:Math.ceil(n/lim)});
}));
r.get('/categories',wrap(async(_q,res)=>{const [c]=await pool.query('SELECT * FROM categories ORDER BY name');res.json(c);}));
r.get('/brands',wrap(async(_q,res)=>{const [b]=await pool.query('SELECT * FROM brands ORDER BY name');res.json(b);}));
r.get('/:id',wrap(async(req,res)=>{
  const [[p]]=await pool.query(`${SEL} WHERE p.id=?`,[+req.params.id]); if(!p) return res.status(404).json({error:'Product not found.'});
  const [rev]=await pool.query('SELECT r.rating,r.body,r.created_at,u.name FROM reviews r JOIN users u ON u.id=r.user_id WHERE product_id=? ORDER BY r.id DESC',[p.id]);
  res.json({...p,reviews:rev});
}));
export default r;
