'use client';
import { useEffect, useState } from 'react';

export default function FounderDashboard(){
  const [visitors, setVisitors] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(()=>{
    // هات الزوار اللي اتسجلوا
    const v = JSON.parse(localStorage.getItem('teos_visitors')||'[]');
    const o = JSON.parse(localStorage.getItem('teos_orders')||'[]');
    setVisitors(v); setOrders(o);
    // لو مفيش داتا - داتا تجريبية عشان تشوف الشكل
    if(v.length===0){
      const demo = [
        {name:'ayman', country:'Egypt 🇪🇬', city:'Alexandria', time:'10:45', action:'دخل', bought:false},
        {name:'sara', country:'Saudi 🇸🇦', city:'Riyadh', time:'10:40', action:'اشترت', bought:true},
        {name:'omar', country:'UAE 🇦🇪', city:'Dubai', time:'10:30', action:'خرج', bought:false},
        {name:'lina', country:'Egypt 🇪🇬', city:'Cairo', time:'10:20', action:'دخل', bought:false},
      ];
      setVisitors(demo);
    }
  },[]);

  const bought = visitors.filter(v=>v.bought).length;
  const byCountry: any = {};
  visitors.forEach(v=>{ byCountry[v.country] = (byCountry[v.country]||0)+1 });

  return (
    <div style={{minHeight:'100vh', background:'#0c0a09', color:'#fff', padding:20, fontFamily:'sans-serif'}} dir="rtl">
      <h1 style={{fontSize:28, fontWeight:900}}>👑 لوحة الفاوندر - Ayman</h1>
      <p style={{color:'#a1a1aa'}}>انت المتحكم هنا - مين دخل ومين طلع ومين اشترى</p>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:12, marginTop:20}}>
        <div style={{background:'#1c1917', padding:16, borderRadius:16}}><div style={{fontSize:28, fontWeight:900}}>{visitors.length}</div><div style={{color:'#a1a1aa'}}>إجمالي الزوار</div></div>
        <div style={{background:'#1c1917', padding:16, borderRadius:16}}><div style={{fontSize:28, fontWeight:900, color:'#22c55e'}}>{bought}</div><div style={{color:'#a1a1aa'}}>اللي اشتروا ✅</div></div>
        <div style={{background:'#1c1917', padding:16, borderRadius:16}}><div style={{fontSize:28, fontWeight:900, color:'#f59e0b'}}>{visitors.length-bought}</div><div style={{color:'#a1a1aa'}}>اللي ما اشتروش 👀</div></div>
        <div style={{background:'#1c1917', padding:16, borderRadius:16}}><div style={{fontSize:28, fontWeight:900, color:'#eab308'}}>{Object.keys(byCountry).length}</div><div style={{color:'#a1a1aa'}}>عدد الدول</div></div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:12}}>
        <div style={{background:'#1c1917', padding:16, borderRadius:16}}>
          <h3>🌍 الزوار من انهي بلد</h3>
          {Object.entries(byCountry).map(([c,n]:any)=>(
            <div key={c} style={{display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #292524'}}><span>{c}</span><b>{n} زائر</b></div>
          ))}
          {Object.keys(byCountry).length===0 && <p style={{color:'#a1a1aa'}}>لسه مفيش زوار</p>}
        </div>
        <div style={{background:'#1c1917', padding:16, borderRadius:16}}>
          <h3>🛒 آخر الطلبات</h3>
          {orders.length===0 ? <p style={{color:'#a1a1aa'}}>لسه مفيش طلبات - اول ما حد يشتري هيظهر هنا بالاسم والبلد والسعر</p> : orders.map((o,i)=><div key={i}>{o.name} - {o.price}</div>)}
          <button onClick={()=>alert('هنا هتتحكم: تقبل / ترفض / ترجع فلوس / تبعت لينك')} style={{marginTop:12, background:'#eab308', color:'#000', padding:'10px 16px', borderRadius:9999, fontWeight:900, border:0, cursor:'pointer'}}>⚙️ تحكم في الطلبات</button>
        </div>
      </div>

      <div style={{background:'#1c1917', padding:16, borderRadius:16, marginTop:12}}>
        <h3>👥 مين دخل ومين طلع - Live</h3>
        <table style={{width:'100%', textAlign:'right'}}>
          <thead><tr style={{color:'#a1a1aa'}}><th>الاسم</th><th>البلد</th><th>المدينة</th><th>الوقت</th><th>الحالة</th></tr></thead>
          <tbody>
            {visitors.map((v,i)=>(
              <tr key={i} style={{borderTop:'1px solid #292524'}}><td style={{padding:8}}>{v.name}.teos</td><td>{v.country}</td><td>{v.city}</td><td>{v.time}</td><td>{v.bought ? '✅ اشترى' : v.action==='خرج' ? '🚪 خرج' : '👀 بيتفرج'}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{marginTop:16, display:'flex', gap:8}}>
        <button onClick={()=>window.open('/','_blank')} style={{background:'#fff', color:'#000', padding:'10px 16px', borderRadius:9999, fontWeight:900, border:0}}>🌐 شوف الموقع كزائر</button>
        <button onClick={()=>window.open('/u/ayman?build=true','_blank')} style={{background:'#eab308', color:'#000', padding:'10px 16px', borderRadius:9999, fontWeight:900, border:0}}>🏗️ ابني موقعي ayman.teos</button>
      </div>
    </div>
  )
}