import {createContext,useContext,useState,useEffect,useCallback} from 'react'; import {api} from './api.js';
const C=createContext(); export const useStore=()=>useContext(C);
const load=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
export function Provider({children}){
  const [user,setUser]=useState(load('user',null)); const [cart,setCart]=useState(load('cart',[])); const [wish,setWish]=useState(load('wish',[])); const [toast,setToast]=useState('');
  useEffect(()=>localStorage.setItem('cart',JSON.stringify(cart)),[cart]); useEffect(()=>localStorage.setItem('wish',JSON.stringify(wish)),[wish]);
  const say=useCallback(m=>{setToast(m);setTimeout(()=>setToast(''),2200)},[]);
  const clearUser=()=>{localStorage.removeItem('user');setUser(null);setWish([])};
  const syncWish=async()=>{try{const g=load('wish',[]);if(g.length)await api('/wishlist/merge',{method:'POST',body:{ids:g}});setWish((await api('/wishlist')).ids)}catch{}};
  useEffect(()=>{if(load('user',null)){api('/auth/profile').then(d=>{setUser(d.user);syncWish()}).catch(()=>{})}window.addEventListener('auth-expired',clearUser);return()=>window.removeEventListener('auth-expired',clearUser)},[]);
  const signIn=d=>{localStorage.setItem('user',JSON.stringify(d.user));setUser(d.user);syncWish()};
  const signOut=()=>{api('/auth/logout',{method:'POST'}).catch(()=>{});clearUser()};
  const add=(p,q=1)=>{if(p.stock<1)return say('That item is out of stock.');setCart(c=>{const x=c.find(i=>i.id===p.id);const n=Math.min((x?.quantity||0)+q,p.stock);
    return x?c.map(i=>i.id===p.id?{...i,quantity:n}:i):[...c,{id:p.id,name:p.name,price:p.price,color:p.color,stock:p.stock,quantity:n}]});say(`${p.name} added to cart`)};
  const setQty=(id,q)=>setCart(c=>c.map(i=>i.id===id?{...i,quantity:Math.max(1,Math.min(q,i.stock))}:i));
  const remove=id=>setCart(c=>c.filter(i=>i.id!==id)); const clear=()=>setCart([]);
  const toggleWish=id=>{const on=wish.includes(id);setWish(w=>on?w.filter(x=>x!==id):[...w,id]);if(user)api('/wishlist/'+id,{method:on?'DELETE':'PUT'}).catch(()=>{setWish(w=>on?[...w,id]:w.filter(x=>x!==id));say('Couldn’t update your wishlist. Try again.')})};
  return <C.Provider value={{user,signIn,signOut,cart,add,setQty,remove,clear,wish,toggleWish,say}}>{children}<div className={'toast'+(toast?' show':'')} role="status">{toast}</div></C.Provider>;
}
