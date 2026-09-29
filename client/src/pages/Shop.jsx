import {useEffect,useState} from 'react'; import {useSearchParams,Link} from 'react-router-dom'; import {api} from '../api.js';
import ProductCard,{Skeletons} from '../components/ProductCard.jsx';
export default function Shop(){
  const [sp,setSp]=useSearchParams(); const [data,setData]=useState(null); const [cats,setCats]=useState([]); const [err,setErr]=useState(''); const [open,setOpen]=useState(false);
  const set=(k,v)=>{const n=new URLSearchParams(sp);v?n.set(k,v):n.delete(k);if(k!=='page')n.delete('page');setSp(n)};
  useEffect(()=>{api('/products/categories').then(setCats).catch(()=>{})},[]);
  useEffect(()=>{setData(null);setErr('');api('/products?'+sp.toString()).then(setData).catch(e=>setErr(e.message))},[sp]);
  const page=+sp.get('page')||1;
  return <div className="wrap sec"><nav className="crumbs"><Link to="/">Home</Link> / Shop</nav>
    <div className="row between"><h1 className="h1">{sp.get('q')?`Results for “${sp.get('q')}”`:'All objects'}</h1><span className="muted">{data?`${data.total} products`:''}</span></div>
    <button className="btn ghost sm only-m" onClick={()=>setOpen(!open)} aria-expanded={open}>Filters</button>
    <div className="shop"><aside className={'filters'+(open?' open':'')}>
      <h4>Category</h4><button className={!sp.get('category')?'chip on':'chip'} onClick={()=>set('category','')}>All</button>
      {cats.map(c=><button key={c.id} className={sp.get('category')===c.slug?'chip on':'chip'} onClick={()=>set('category',c.slug)}>{c.name}</button>)}
      <h4>Max price</h4><select value={sp.get('max')||''} onChange={e=>set('max',e.target.value)} aria-label="Max price"><option value="">Any</option><option>50</option><option>100</option><option>150</option></select>
      <h4>Sort by</h4><select value={sp.get('sort')||''} onChange={e=>set('sort',e.target.value)} aria-label="Sort"><option value="">Featured</option><option value="new">Newest</option><option value="rating">Top rated</option><option value="price_asc">Price, low to high</option><option value="price_desc">Price, high to low</option></select>
    </aside><div>
      {err?<p className="err">{err}</p>:!data?<Skeletons n={6}/>:data.items.length===0?<div className="empty"><h3>No matches</h3><p>Try a different word or clear your filters.</p><button className="btn" onClick={()=>setSp({})}>Clear filters</button></div>
      :<><div className="grid">{data.items.map(p=><ProductCard key={p.id} p={p}/>)}</div>
        {data.pages>1&&<div className="row pager"><button className="btn ghost sm" disabled={page<=1} onClick={()=>set('page',page-1)}>Previous</button><span>Page {page} of {data.pages}</span><button className="btn ghost sm" disabled={page>=data.pages} onClick={()=>set('page',page+1)}>Next</button></div>}</>}
    </div></div></div>;
}
