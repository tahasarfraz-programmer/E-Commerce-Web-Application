import {useEffect,useState} from 'react'; import {Link} from 'react-router-dom'; import {api} from '../api.js';
import ProductCard,{Skeletons} from '../components/ProductCard.jsx'; import ProductArt from '../components/ProductArt.jsx';
export default function Home(){
  const [items,setItems]=useState(null); const [cats,setCats]=useState([]); const [err,setErr]=useState(''); const [banners,setBanners]=useState([]);
  useEffect(()=>{api('/products?sort=rating&limit=4').then(d=>setItems(d.items)).catch(e=>setErr(e.message));api('/products/categories').then(setCats).catch(()=>{});api('/content/banners').then(setBanners).catch(()=>{});},[]);
  const bn=banners[0]||{title:'Two-week studio sale',subtitle:'Selected stoneware and lighting, up to 25% off.',link:'/shop?sort=price_asc'};
  return <>
    <section className="hero"><div className="wrap hero-in">
      <div><h1><span>Objects that</span><span>make a room</span><span>feel lived in.</span></h1>
        <p>Stoneware, brass lighting and woven linen from small studios. Free shipping over $150.</p>
        <div className="row"><Link className="btn" to="/shop">Shop the collection</Link><Link className="btn ghost" to="/shop?category=lighting">See lighting</Link></div></div>
      <div className="hero-art"><ProductArt color="#C9A227" name="Arc Lamp"/><ProductArt color="#2F5D50" name="Vase"/><ProductArt color="#3D6B7A" name="Bowl"/></div>
    </div></section>
    <section className="wrap sec"><h2>Shop by room object</h2>
      <div className="cats">{cats.map(c=><Link key={c.id} to={`/shop?category=${c.slug}`}>{c.name}</Link>)}</div></section>
    <section className="wrap sec"><div className="row between"><h2>Most loved right now</h2><Link to="/shop">View all</Link></div>
      {err?<p className="err">{err}</p>:!items?<Skeletons/>:<div className="grid">{items.map(p=><ProductCard key={p.id} p={p}/>)}</div>}</section>
    <section className="promo"><div className="wrap"><h2>{bn.title}</h2><p>{bn.subtitle}</p><Link className="btn light" to={bn.link}>Browse the sale</Link></div></section>
  </>;
}
