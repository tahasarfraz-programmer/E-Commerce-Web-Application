import {useState,useEffect} from 'react'; import {useNavigate,useSearchParams,Link} from 'react-router-dom'; import {api} from '../api.js'; import {useStore} from '../store.jsx';
export default function Auth({mode}){
  const reg=mode==='register'; const {signIn}=useStore(); const nav=useNavigate(); const [sp]=useSearchParams();
  const [f,setF]=useState({name:'',email:'',password:''}); const [err,setErr]=useState(''); const [busy,setBusy]=useState(false);
  const go=async e=>{e.preventDefault();setBusy(true);setErr('');try{const d=await api(reg?'/auth/register':'/auth/login',{method:'POST',body:f});signIn(d);nav(sp.get('next')||(d.user.role==='admin'?'/admin':'/account'))}catch(x){setErr(x.message)}finally{setBusy(false)}};
  return <div className="wrap sec"><form className="auth" onSubmit={go}><h1 className="h1">{reg?'Create your account':'Sign in'}</h1>
    {reg&&<label>Name<input required value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></label>}
    <label>Email<input type="email" required value={f.email} onChange={e=>setF({...f,email:e.target.value})}/></label>
    <label>Password<input type="password" required minLength={reg?10:1} value={f.password} onChange={e=>setF({...f,password:e.target.value})}/></label>
    {reg&&<small className="muted">At least 10 characters, with a letter and a number.</small>}{err&&<p className="err" role="alert">{err}</p>}<button className="btn" disabled={busy}>{busy?'Please wait…':reg?'Create account':'Sign in'}</button>
    {!reg&&<Link to="/forgot-password">Forgot your password?</Link>}<p className="muted">{reg?<>Have an account? <Link to="/login">Sign in</Link></>:<>New here? <Link to="/register">Create an account</Link></>}</p></form></div>;
}
