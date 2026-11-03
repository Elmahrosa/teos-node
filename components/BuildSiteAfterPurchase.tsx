'use client';
export default function BuildSiteAfterPurchase({ domain }: { domain: string }) {
  const short = domain.replace('.teos','');
  const buildUrl = `/u/${short}?build=${typeof window !== 'undefined' ? encodeURIComponent(location.href) : ''}`;
  return (
    <div style={{marginTop:4, padding:14, borderRadius:16, background:'#18181b', border:'1px solid rgba(234,179,8,0.5)', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12}}>
      <div style={{display:'flex', alignItems:'center', gap:10}}>
        <div style={{width:40, height:40, background:'#eab308', borderRadius:9999, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900}}>🏗️</div>
        <div>
          <div style={{color:'#fff', fontWeight:700, fontSize:14}}>ابني موقعك بعد الشراء</div>
          <div style={{color:'#a1a1aa', fontSize:11, fontFamily:'monospace'}}>{buildUrl}</div>
          <div style={{color:'#71717a', fontSize:11}}>{domain} جاهز للنقل - فاوندر</div>
        </div>
      </div>
      <button onClick={()=>window.open(buildUrl,'_blank')} style={{background:'#eab308', color:'#000', padding:'10px 18px', borderRadius:9999, fontWeight:900, border:0, cursor:'pointer'}}>
        افتح الآن →
      </button>
    </div>
  )
}