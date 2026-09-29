import {Routes,Route,Link,Navigate,useNavigate,useLocation} from 'react-router-dom'; import {useState,useEffect} from 'react'; import {useStore} from './store.jsx';
import Home from './pages/Home.jsx'; import Shop from './pages/Shop.jsx'; import Product from './pages/Product.jsx'; import Cart from './pages/Cart.jsx'; import Auth from './pages/Auth.jsx'; import Account from './pages/Account.jsx'; import Wishlist from './pages/Wishlist.jsx'; import {Forgot,Reset,Verify} from './pages/Recovery.jsx'; import Admin from './pages/Admin.jsx'; import Logo from './components/Logo.jsx';
const Guard=({role,children})=>{const {user}=useStore();return !user?<Navigate to="/login"/>:role&&user.role!==role?<Navigate to="/"/>:children};
export default function App(){
  const {user,cart,wish}=useStore(); const nav=useNavigate(); const [q,setQ]=useState(''); const loc=useLocation();
  useEffect(()=>window.scrollTo(0,0),[loc.pathname]);
  const n=cart.reduce((s,i)=>s+i.quantity,0);
  return <><a className="skip" href="#main">Skip to content</a><div className="announce">Free shipping on orders over $150</div>
    <header className="head"><div className="wrap bar"><Logo/>
      <nav className="nav"><Link to="/shop">Shop</Link><Link to="/shop?category=vessels">Vessels</Link><Link to="/shop?category=lighting">Lighting</Link><Link to="/shop?category=textiles">Textiles</Link></nav>
      <form onSubmit={e=>{e.preventDefault();nav('/shop?q='+encodeURIComponent(q))}} role="search"><input aria-label="Search products" placeholder="Search" value={q} onChange={e=>setQ(e.target.value)}/></form>
      <div className="row"><Link to={user?.role==='admin'?'/admin':user?'/account':'/login'}>{user?user.name.split(' ')[0]:'Sign in'}</Link><Link to="/wishlist" title="Wishlist">♡ {wish.length}</Link><Link to="/cart" className="cartlink">Cart <b>{n}</b></Link></div></div></header>
    <main id="main" className="page" key={loc.pathname}><Routes><Route path="/" element={<Home/>}/><Route path="/shop" element={<Shop/>}/><Route path="/product/:id" element={<Product/>}/><Route path="/cart" element={<Cart/>}/>
      <Route path="/login" element={<Auth/>}/><Route path="/register" element={<Auth mode="register"/>}/><Route path="/forgot-password" element={<Forgot/>}/><Route path="/reset-password" element={<Reset/>}/><Route path="/verify-email" element={<Verify/>}/><Route path="/wishlist" element={<Wishlist/>}/><Route path="/account" element={<Guard><Account/></Guard>}/><Route path="/admin" element={<Guard role="admin"><Admin/></Guard>}/>
      <Route path="*" element={<div className="wrap sec empty"><h1>404</h1><p>That page doesn’t exist.</p><Link className="btn" to="/">Go home</Link></div>}/></Routes></main>
    <footer className="foot"><div className="wrap">Atelier — objects for the home. Demo store; no real payments are taken.</div></footer></>;
}
