import {useEffect,useState} from 'react'; import {api,money} from '../api.js'; import {useStore} from '../store.jsx'; import Bars from '../components/Bars.jsx';
const yn=v=>v?'Yes':'No';
function Field({f,v,set,opts}){
  if(f.t==='checkbox') return <label className="check"><input type="checkbox" checked={!!v} onChange={e=>set(e.target.checked)}/>{f.l}</label>;
  if(f.t==='select') return <label>{f.l}<select required value={v??''} onChange={e=>set(e.target.value)}><option value="">Choose…</option>{(opts||[]).map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select></label>;
  return <label>{f.l}<input type={f.t||'text'} step={f.t==='number'?'any':undefined} required={!f.opt} value={v??''} onChange={e=>set(e.target.value)}/></label>;
}
function Modal({title,fields,value,setValue,onSave,onCancel,err,lists}){
  return <div className="modal" role="dialog" aria-modal="true" aria-label={title}><form onSubmit={onSave}><h3>{title}</h3>
    {fields.map(f=><Field key={f.k} f={f} v={value[f.k]} set={x=>setValue({...value,[f.k]:x})} opts={lists?.[f.k]}/>)}
    {err&&<p className="err" role="alert">{err}</p>}<div className="row"><button className="btn">Save</button><button type="button" className="btn ghost" onClick={onCancel}>Cancel</button></div></form></div>;
}
function Resource({path,cols,fields,blank,say,readOnly,noDelete,lists,extraLoad}){
  const [rows,setRows]=useState(null); const [edit,setEdit]=useState(null); const [err,setErr]=useState('');
  const load=()=>api('/admin/'+path).then(setRows).catch(e=>setErr(e.message)); useEffect(()=>{setRows(null);load()},[path]);
  const save=async e=>{e.preventDefault();setErr('');try{await api(edit.id?`/admin/${path}/${edit.id}`:'/admin/'+path,{method:edit.id?'PUT':'POST',body:edit});say('Saved');setEdit(null);load();extraLoad?.()}catch(x){setErr(x.message)}};
  const del=async r=>{if(!confirm('Delete this item? This can’t be undone.'))return;try{await api(`/admin/${path}/${r.id}`,{method:'DELETE'});say('Deleted');load();extraLoad?.()}catch(x){say(x.message)}};
  return <div>{!readOnly&&<button className="btn sm" onClick={()=>{setErr('');setEdit(blank)}}>New</button>}{err&&!edit&&<p className="err">{err}</p>}
    {!rows?<p>Loading…</p>:<div className="scroll"><table><thead><tr>{cols.map(c=><th key={c[0]}>{c[1]}</th>)}<th/></tr></thead><tbody>{rows.map(r=><tr key={r.id}>
      {cols.map(([k,,f])=><td key={k}>{f?f(r[k]):String(r[k]??'—')}</td>)}
      <td>{!readOnly&&<button className="link" onClick={()=>{setErr('');setEdit(r)}}>Edit</button>} {!noDelete&&<button className="link" onClick={()=>del(r)}>Delete</button>}</td></tr>)}</tbody></table>
      {!rows.length&&<p className="muted">Nothing here yet.</p>}</div>}
    {edit&&<Modal title={edit.id?'Edit':'New'} fields={fields} value={edit} setValue={setEdit} onSave={save} onCancel={()=>setEdit(null)} err={err} lists={lists}/>}</div>;
}
const PF=[{k:'name',l:'Name'},{k:'description',l:'Description',opt:1},{k:'price',l:'Price',t:'number'},{k:'compare_at',l:'Original price',t:'number',opt:1},{k:'stock',l:'Stock',t:'number'},{k:'category_id',l:'Category',t:'select'},{k:'brand_id',l:'Brand',t:'select'},{k:'color',l:'Color (#hex)'},{k:'badge',l:'Badge',opt:1}];
const pBlank={name:'',description:'',price:'',compare_at:'',category_id:'',brand_id:'',stock:10,color:'#2F5D50',badge:''};
export default function Admin(){
  const {say}=useStore(); const [tab,setTab]=useState('overview'); const [stats,setStats]=useState(); const [prods,setProds]=useState([]); const [orders,setOrders]=useState([]); const [lists,setLists]=useState({});
  const [edit,setEdit]=useState(null); const [err,setErr]=useState('');
  const loadLists=()=>Promise.all([api('/products/categories'),api('/products/brands')]).then(([c,b])=>setLists({category_id:c,brand_id:b})).catch(()=>{});
  const load=()=>{api('/admin/analytics').then(setStats).catch(e=>setErr(e.message));api('/products?limit=48').then(d=>setProds(d.items));api('/admin/orders').then(setOrders).catch(()=>{})};
  useEffect(()=>{load();loadLists()},[]);
  const save=async e=>{e.preventDefault();setErr('');const b={...edit,compare_at:edit.compare_at||null,badge:edit.badge||null};
    try{await api(edit.id?'/admin/products/'+edit.id:'/admin/products',{method:edit.id?'PUT':'POST',body:b});say('Product saved');setEdit(null);load()}catch(x){setErr(x.message)}};
  const del=async p=>{if(!confirm(`Delete “${p.name}”? This can’t be undone.`))return;try{await api('/admin/products/'+p.id,{method:'DELETE'});say('Product deleted');load()}catch(x){say(x.message)}};
  const status=async(id,s)=>{await api('/admin/orders/'+id,{method:'PATCH',body:{status:s}});say('Order updated');load()};
  const date=v=>String(v).slice(0,10);
  const tabs=[['overview','Overview'],['products','Products'],['orders','Orders'],['categories','Categories'],['brands','Brands'],['coupons','Coupons'],['banners','Banners'],['customers','Customers'],['reviews','Reviews']];
  return <div className="wrap sec"><h1 className="h1">Admin</h1><div className="row tabs wrap-t">{tabs.map(([k,l])=><button key={k} className={tab===k?'chip on':'chip'} onClick={()=>setTab(k)}>{l}</button>)}</div>
    {err&&!edit&&<p className="err">{err}</p>}
    {tab==='overview'&&stats&&<><div className="stats">{[['Revenue',money(stats.revenue)],['Orders',stats.orders],['Pending',stats.pending],['Customers',stats.customers],['Low stock',stats.low_stock]].map(([k,v])=><div key={k}><small>{k}</small><b>{v}</b></div>)}</div>
      <div className="charts"><Bars title="Revenue, last 14 days" data={stats.daily} x="d" y="revenue" fmt={money}/><Bars title="Revenue by category" data={stats.cats} x="name" y="revenue" fmt={money}/></div>
      <h3>Top sellers</h3>{stats.top.length?stats.top.map(t=><p key={t.name}>{t.name} — {t.sold} sold</p>):<p className="muted">No sales yet.</p>}</>}
    {tab==='products'&&<><button className="btn sm" onClick={()=>{setErr('');setEdit(pBlank)}}>New product</button>
      <div className="scroll"><table><thead><tr><th>Name</th><th>Price</th><th>Stock</th><th/></tr></thead><tbody>{prods.map(p=><tr key={p.id}><td>{p.name}</td><td>{money(p.price)}</td><td>{p.stock}</td><td><button className="link" onClick={()=>{setErr('');setEdit(p)}}>Edit</button> <button className="link" onClick={()=>del(p)}>Delete</button></td></tr>)}</tbody></table></div></>}
    {tab==='orders'&&<div className="scroll"><table><thead><tr><th>#</th><th>Customer</th><th>Coupon</th><th>Total</th><th>Status</th></tr></thead><tbody>{orders.map(o=><tr key={o.id}><td>{o.id}</td><td>{o.customer}</td><td>{o.coupon_code||'—'}</td><td>{money(o.total)}</td><td><select value={o.status} onChange={e=>status(o.id,e.target.value)}>{['pending','paid','shipped','delivered','cancelled'].map(s=><option key={s}>{s}</option>)}</select></td></tr>)}</tbody></table>{!orders.length&&<p className="muted">No orders yet.</p>}</div>}
    {tab==='categories'&&<Resource say={say} path="categories" cols={[['name','Name'],['slug','Slug']]} fields={[{k:'name',l:'Name'},{k:'slug',l:'Slug (lowercase-with-dashes)'}]} blank={{name:'',slug:''}} extraLoad={loadLists}/>}
    {tab==='brands'&&<Resource say={say} path="brands" cols={[['name','Name']]} fields={[{k:'name',l:'Name'}]} blank={{name:''}} extraLoad={loadLists}/>}
    {tab==='coupons'&&<Resource say={say} path="coupons" cols={[['code','Code'],['percent_off','% off'],['min_subtotal','Min subtotal'],['used_count','Used'],['max_uses','Limit'],['expires_at','Expires'],['active','Active',yn]]}
      fields={[{k:'code',l:'Code'},{k:'percent_off',l:'Percent off (1-90)',t:'number'},{k:'min_subtotal',l:'Minimum subtotal',t:'number',opt:1},{k:'max_uses',l:'Use limit (blank = unlimited)',t:'number',opt:1},{k:'expires_at',l:'Expires (last valid day)',t:'date',opt:1},{k:'active',l:'Active',t:'checkbox'}]}
      blank={{code:'',percent_off:10,min_subtotal:0,max_uses:'',expires_at:'',active:true}}/>}
    {tab==='banners'&&<Resource say={say} path="banners" cols={[['title','Title'],['link','Link'],['sort_order','Order'],['active','Active',yn]]}
      fields={[{k:'title',l:'Title'},{k:'subtitle',l:'Subtitle',opt:1},{k:'link',l:'Link (e.g. /shop?category=lighting)'},{k:'sort_order',l:'Sort order',t:'number'},{k:'active',l:'Active',t:'checkbox'}]} blank={{title:'',subtitle:'',link:'/shop',sort_order:0,active:true}}/>}
    {tab==='customers'&&<Resource say={say} path="customers" readOnly noDelete cols={[['name','Name'],['email','Email'],['role','Role'],['email_verified_at','Verified',yn],['orders','Orders'],['spent','Spent',money],['created_at','Joined',date]]}/>}
    {tab==='reviews'&&<Resource say={say} path="reviews" readOnly cols={[['product','Product'],['customer','Customer'],['rating','Rating'],['body','Review']]}/>}
    {edit&&tab==='products'&&<Modal title={edit.id?'Edit product':'New product'} fields={PF} value={edit} setValue={setEdit} onSave={save} onCancel={()=>setEdit(null)} err={err} lists={lists}/>}
  </div>;
}
