import {useEffect,useState} from 'react'; import {Link,useSearchParams} from 'react-router-dom'; import {api} from '../api.js';
export function Forgot(){
  const [email,setEmail]=useState(''); const [done,setDone]=useState(false); const [err,setErr]=useState(''); const [busy,setBusy]=useState(false);
  const go=async e=>{e.preventDefault();setBusy(true);setErr('');try{await api('/auth/forgot-password',{method:'POST',body:{email}});setDone(true)}catch(x){setErr(x.message)}finally{setBusy(false)}};
  return <div className="wrap sec"><form className="auth" onSubmit={go}><h1 className="h1">Reset your password</h1>
    {done?<p>If that email has an account, a reset link is on its way. It works for 1 hour.</p>:<>
    <label>Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label>
    {err&&<p className="err" role="alert">{err}</p>}<button className="btn" disabled={busy}>{busy?'Sending…':'Send reset link'}</button></>}
    <Link to="/login">Back to sign in</Link></form></div>;
}
export function Reset(){
  const [sp]=useSearchParams(); const [pw,setPw]=useState(''); const [done,setDone]=useState(false); const [err,setErr]=useState(''); const [busy,setBusy]=useState(false);
  const go=async e=>{e.preventDefault();setBusy(true);setErr('');try{await api('/auth/reset-password',{method:'POST',body:{token:sp.get('token'),password:pw}});setDone(true)}catch(x){setErr(x.message)}finally{setBusy(false)}};
  return <div className="wrap sec"><form className="auth" onSubmit={go}><h1 className="h1">Choose a new password</h1>
    {done?<><p>Password updated. You’ve been signed out everywhere.</p><Link className="btn" to="/login">Sign in</Link></>:<>
    <label>New password<input type="password" required minLength={10} value={pw} onChange={e=>setPw(e.target.value)}/></label><small className="muted">At least 10 characters, with a letter and a number.</small>
    {err&&<p className="err" role="alert">{err}</p>}<button className="btn" disabled={busy||!sp.get('token')}>{busy?'Saving…':'Save password'}</button></>}</form></div>;
}
export function Verify(){
  const [sp]=useSearchParams(); const [s,setS]=useState({state:'loading'});
  useEffect(()=>{api('/auth/verify-email',{method:'POST',body:{token:sp.get('token')}}).then(()=>setS({state:'ok'})).catch(e=>setS({state:'fail',msg:e.message}))},[]);
  return <div className="wrap sec empty"><h1>{s.state==='loading'?'Checking your link…':s.state==='ok'?'Email confirmed':'Link not valid'}</h1>
    {s.state==='fail'&&<p>{s.msg}</p>}<Link className="btn" to={s.state==='ok'?'/shop':'/account'}>{s.state==='ok'?'Start shopping':'Go to your account'}</Link></div>;
}
