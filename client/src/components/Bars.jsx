export default function Bars({data,x,y,fmt=v=>v,title}){
  const w=560,h=180,max=Math.max(1,...data.map(d=>d[y])),bw=w/Math.max(data.length,1);
  const tick=v=>{v=String(v);return v.length>9?v.slice(0,8)+'…':v};
  return <figure className="chart"><figcaption>{title}</figcaption>
    {!data.length?<p className="muted">No sales yet.</p>:<svg viewBox={`0 0 ${w} ${h+26}`} role="img" aria-label={title}>
      {data.map((d,i)=>{const bh=Math.max(2,d[y]/max*h);return <g key={i}><rect x={i*bw+6} y={h-bh} width={Math.max(bw-12,4)} height={bh} rx="4" fill="var(--primary)"><title>{d[x]}: {fmt(d[y])}</title></rect>
        <text x={i*bw+bw/2} y={h+18} textAnchor="middle" fontSize="11" fill="var(--muted)">{tick(d[x])}</text></g>})}</svg>}</figure>;
}
