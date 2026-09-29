export async function api(path,{method='GET',body}={}){
  let res; try{res=await fetch('/api'+path,{method,credentials:'include',headers:{'Content-Type':'application/json','X-Requested-With':'atelier'},body:body&&JSON.stringify(body)});}
  catch{throw new Error('Can’t reach the server. Check your connection and try again.');}
  const data=await res.json().catch(()=>({}));
  if(res.status===401) window.dispatchEvent(new Event('auth-expired'));
  if(!res.ok) throw new Error(data.error||'Request failed.'); return data;
}
export const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n);
