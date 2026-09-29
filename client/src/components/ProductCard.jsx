import {Link} from 'react-router-dom'; import ProductArt from './ProductArt.jsx'; import {useStore} from '../store.jsx'; import {money} from '../api.js';
export default function ProductCard({p}){
  const {add,wish,toggleWish}=useStore(); const on=wish.includes(p.id);
  const off=p.compare_at?Math.round((1-p.price/p.compare_at)*100):0;
  return <article className="card">
    <Link to={`/product/${p.id}`} className="card-img">{p.badge&&<span className="badge">{p.badge}</span>}<ProductArt color={p.color} name={p.name}/></Link>
    <button className={'heart'+(on?' on':'')} aria-pressed={on} aria-label={on?'Remove from wishlist':'Add to wishlist'} onClick={()=>toggleWish(p.id)}>{on?'♥':'♡'}</button>
    <div className="card-body"><small>{p.brand}</small>
      <h3><Link to={`/product/${p.id}`}>{p.name}</Link></h3>
      <div className="row"><span className="price">{money(p.price)}</span>{p.compare_at&&<><s>{money(p.compare_at)}</s><em>−{off}%</em></>}</div>
      <div className="row between"><span className="muted">★ {p.rating} ({p.reviews_count})</span>
        <button className="btn sm" disabled={p.stock<1} onClick={()=>add(p)}>{p.stock<1?'Sold out':'Add to cart'}</button></div></div>
  </article>;
}
export const Skeletons=({n=4})=><div className="grid">{Array.from({length:n},(_,i)=><div key={i} className="card sk"><div className="card-img"/><div className="card-body"><i/><i/></div></div>)}</div>;
