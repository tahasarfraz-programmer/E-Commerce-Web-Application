import {useEffect,useState} from 'react'; import {Link} from 'react-router-dom'; import {api} from '../api.js'; import {useStore} from '../store.jsx'; import ProductCard,{Skeletons} from '../components/ProductCard.jsx';
export default function Wishlist(){
  const {wish}=useStore(); const [items,setItems]=useState(null); const [err,setErr]=useState(''); const key=wish.join(',');
  useEffect(()=>{api(`/products?ids=${key}&limit=48`).then(d=>setItems(d.items)).catch(e=>setErr(e.message))},[key]);
  return <div className="wrap sec"><h1 className="h1">Saved for later</h1>
    {err?<p className="err">{err}</p>:!items?<Skeletons/>:!wish.length||!items.length?<div className="empty"><h3>Nothing saved yet</h3><p>Tap the heart on any product to keep it here.</p><Link className="btn" to="/shop">Browse the shop</Link></div>
    :<div className="grid">{items.filter(p=>wish.includes(p.id)).map(p=><ProductCard key={p.id} p={p}/>)}</div>}</div>;
}
