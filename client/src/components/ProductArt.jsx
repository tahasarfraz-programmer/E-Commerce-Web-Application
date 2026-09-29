export default function ProductArt({color='#2F5D50',name='',big=false}){
  const i=[...name].reduce((a,c)=>a+c.charCodeAt(0),0)%3;
  return <svg viewBox="0 0 200 200" className="art" role="img" aria-label={name} style={{background:color+'22'}}>
    <ellipse cx="100" cy="176" rx="52" ry="7" fill="#000" opacity=".12"/>
    {i===0&&<path d="M84 34h32l-4 30c26 14 34 44 30 84-2 18-12 26-24 28H82c-12-2-22-10-24-28-4-40 4-70 30-84z" fill={color}/>}
    {i===1&&<path d="M40 96h120c0 44-24 74-60 74S40 140 40 96z" fill={color}/>}
    {i===2&&<g><rect x="92" y="30" width="16" height="96" rx="8" fill={color}/><path d="M60 126h80l-12 46H72z" fill={color} opacity=".85"/></g>}
    <path d="M78 70c-6 30-4 60 2 88" stroke="#fff" strokeOpacity=".28" strokeWidth="5" fill="none" strokeLinecap="round"/>
  </svg>;
}
