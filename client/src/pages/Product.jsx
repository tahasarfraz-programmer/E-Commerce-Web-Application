import {useEffect,useState} from 'react'; import {useParams,Link} from 'react-router-dom'; import {api,money} from '../api.js';
import ProductArt from '../components/ProductArt.jsx'; import {useStore} from '../store.jsx';
export default function Product(){
  const {id}=useParams(); const [p,setP]=useState(null); const [err,setErr]=useState(''); const [q,setQ]=useState(1); const {add,wish,toggleWish}=useStore();
  useEffect(()=>{setP(null);setErr('');api('/products/'+id).then(setP).catch(e=>setErr(e.message))},[id]);
  if(err) return <div className="wrap sec empty"><h1>Product not found</h1><p>{err}</p><Link className="btn" to="/shop">Back to shop</Link></div>;
  if(!p) return <div className="wrap sec"><div className="sk pdp"><div className="card-img"/><div><i/><i/></div></div></div>;
  return <div className="wrap sec"><nav className="crumbs"><Link to="/shop">Shop</Link> / <Link to={`/shop?category=${p.category_slug}`}>{p.category}</Link></nav>
    <div className="pdp"><ProductArt color={p.color} name={p.name}/>
      <div><small className="muted">{p.brand}</small><h1 className="h1">{p.name}</h1>
        <p className="muted">★ {p.rating} · {p.reviews_count} reviews</p>
        <p className="big">{money(p.price)} {p.compare_at&&<s>{money(p.compare_at)}</s>}</p>
        <p>{p.description}</p>
        <p className={p.stock>5?'ok':'warn'}>{p.stock<1?'Out of stock':p.stock>5?'In stock':`Only ${p.stock} left`}</p>
        <div className="row"><div className="qty"><button aria-label="Decrease" onClick={()=>setQ(Math.max(1,q-1))}>−</button><span>{q}</span><button aria-label="Increase" onClick={()=>setQ(Math.min(p.stock,q+1))}>+</button></div>
          <button className="btn" disabled={p.stock<1} onClick={()=>add(p,q)}>Add to cart</button>
          <button className="btn ghost" onClick={()=>toggleWish(p.id)}>{wish.includes(p.id)?'♥ Saved':'♡ Save'}</button></div>
        <details><summary>Shipping and returns</summary><p>Ships in 2–3 business days. Free over $150. Return within 30 days, unused.</p></details>
      </div></div>
    <h2>Reviews</h2>{p.reviews.length?p.reviews.map((r,i)=><p key={i}><b>{r.name}</b> ★{r.rating}<br/>{r.body}</p>):<p className="muted">No reviews yet for this product.</p>}
    <ReviewForm id={p.id} onDone={()=>api('/products/'+id).then(setP)}/>
  </div>;
}

function ReviewForm({id,onDone}){
  const {user,say}=useStore(); const [rating,setRating]=useState(5); const [body,setBody]=useState(''); const [err,setErr]=useState(''); const [busy,setBusy]=useState(false);
  if(!user) return <p><Link to={`/login?next=/product/${id}`}>Sign in</Link> to review products you’ve bought.</p>;
  const go=async e=>{e.preventDefault();setBusy(true);setErr('');try{await api('/reviews',{method:'POST',body:{product_id:id,rating,body}});say('Review posted');setBody('');onDone()}catch(x){setErr(x.message)}finally{setBusy(false)}};
  return <form className="form" onSubmit={go}><h3>Write a review</h3>
    <label>Rating<select value={rating} onChange={e=>setRating(+e.target.value)}>{[5,4,3,2,1].map(n=><option key={n} value={n}>{n} out of 5</option>)}</select></label>
    <label>Your review (optional)<textarea rows={4} maxLength={1000} value={body} onChange={e=>setBody(e.target.value)}/></label>
    {err&&<p className="err" role="alert">{err}</p>}<button className="btn" disabled={busy}>{busy?'Posting…':'Post review'}</button></form>;
}
