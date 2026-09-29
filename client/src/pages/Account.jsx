import {useEffect,useState} from 'react'; import {Link} from 'react-router-dom'; import {api,money} from '../api.js'; import {useStore} from '../store.jsx';
const blank={label:'Home',name:'',line1:'',city:'',postal:'',is_default:false};
function Orders(){
  const [o,setO]=useState(null); const [err,setErr]=useState('');
  useEffect(()=>{api('/orders').then(setO).catch(e=>setErr(e.message))},[]);
  if(err) return <p className="err">{err}</p>; if(!o) return <p>Loading…</p>;
  if(!o.length) return <div className="empty"><p>No orders yet.</p><Link className="btn" to="/shop">Start shopping</Link></div>;
  return o.map(x=><div className="ord" key={x.id}><div className="row between"><b>Order #{x.id}</b><span className={'st '+x.status}>{x.status}</span></div><p className="muted">{x.items.map(i=>`${i.quantity}× ${i.name}`).join(', ')}</p><b>{money(x.total)}</b></div>);
}
function Addresses(){
  const {say}=useStore(); const [list,setList]=useState(null); const [f,setF]=useState(null); const [err,setErr]=useState('');
  const load=()=>api('/addresses').then(setList).catch(e=>setErr(e.message)); useEffect(()=>{load()},[]);
  const save=async e=>{e.preventDefault();setErr('');try{await api(f.id?'/addresses/'+f.id:'/addresses',{method:f.id?'PUT':'POST',body:{label:f.label,name:f.name,line1:f.line1,city:f.city,postal:f.postal,is_default:!!f.is_default}});say('Address saved');setF(null);load()}catch(x){setErr(x.message)}};
  const del=async a=>{if(!confirm(`Delete the “${a.label}” address?`))return;await api('/addresses/'+a.id,{method:'DELETE'});say('Address deleted');load()};
  if(f) return <form className="form" onSubmit={save}>{[['label','Label (Home, Work…)'],['name','Full name'],['line1','Street address'],['city','City'],['postal','Postal code']].map(([k,l])=><label key={k}>{l}<input required value={f[k]} onChange={e=>setF({...f,[k]:e.target.value})}/></label>)}
    <label className="check"><input type="checkbox" checked={f.is_default} onChange={e=>setF({...f,is_default:e.target.checked})}/>Use as my default address</label>
    {err&&<p className="err" role="alert">{err}</p>}<div className="row"><button className="btn">Save address</button><button type="button" className="btn ghost" onClick={()=>{setF(null);setErr('')}}>Cancel</button></div></form>;
  return <>{err&&<p className="err">{err}</p>}<button className="btn sm" onClick={()=>setF(blank)}>Add address</button>
    {!list?<p>Loading…</p>:!list.length?<div className="empty"><p>No saved addresses. Add one to speed up checkout.</p></div>
    :list.map(a=><div className="ord" key={a.id}><div className="row between"><b>{a.label}{a.is_default&&' · Default'}</b><span><button className="link" onClick={()=>setF(a)}>Edit</button> <button className="link" onClick={()=>del(a)}>Delete</button></span></div><p className="muted">{a.name}, {a.line1}, {a.city} {a.postal}</p></div>)}</>;
}
function Profile(){
  const {user,say}=useStore(); const [v,setV]=useState(user.verified); const [busy,setBusy]=useState(false);
  useEffect(()=>{api('/auth/profile').then(d=>setV(d.user.verified)).catch(()=>{})},[]);
  const resend=async()=>{setBusy(true);try{await api('/auth/resend-verification',{method:'POST'});say('Verification email sent')}catch(x){say(x.message)}finally{setBusy(false)}};
  return <div><p><b>{user.name}</b><br/>{user.email}</p>
    {v?<p className="ok">Email verified.</p>:<><p className="warn">Your email isn’t verified yet. You need it to write reviews.</p><button className="btn sm" disabled={busy} onClick={resend}>{busy?'Sending…':'Resend verification email'}</button></>}</div>;
}
export default function Account(){
  const {user,signOut}=useStore(); const [tab,setTab]=useState('orders');
  return <div className="wrap sec"><div className="row between"><h1 className="h1">Hello, {user.name}</h1><button className="btn ghost sm" onClick={signOut}>Sign out</button></div>
    <div className="row tabs">{[['orders','Orders'],['addresses','Addresses'],['profile','Profile']].map(([k,l])=><button key={k} className={tab===k?'chip on':'chip'} onClick={()=>setTab(k)}>{l}</button>)}</div>
    {tab==='orders'&&<Orders/>}{tab==='addresses'&&<Addresses/>}{tab==='profile'&&<Profile/>}</div>;
}
