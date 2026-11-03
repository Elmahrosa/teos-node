import { useState } from 'react';

export default function CloneGate({ domain }) {
  const [url, setUrl] = useState('');
  const [mode, setMode] = useState('clone'); // clone | upload | create

  const handleClone = async () => {
    if(!url) return alert('حط لينك موقعك القديم');
    // هنا بننادي الـ API اللي بينسخ الموقع
    window.location.href = \/api/clone?from=\&to=\\;
  };

  return (
    <div className="bg-black text-white p-8 rounded-2xl border border-yellow-500/30 max-w-2xl mx-auto mt-10">
      <h1 className="text-3xl text-yellow-400 font-bold">👑 {domain} جاهز للنسخ</h1>
      <p className="text-gray-400 mt-2">SOVEREIGN RESOLVED - Site 022 Live</p>

      <div className="grid grid-cols-3 gap-4 mt-8">
        <button onClick={()=>setMode('clone')} className={\p-4 rounded-xl \\}>🔗 انسخ موقعي</button>
        <button onClick={()=>setMode('upload')} className={\p-4 rounded-xl \\}>📁 عندي موقع جاهز</button>
        <button onClick={()=>setMode('create')} className={\p-4 rounded-xl \\}>✨ أنشئ جديد</button>
      </div>

      {mode==='clone' && (
        <div className="mt-6">
          <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://موقعك-القديم.com" className="w-full p-4 bg-zinc-900 rounded-xl border border-zinc-700" />
          <button onClick={handleClone} className="w-full mt-4 bg-yellow-500 text-black p-4 rounded-xl font-bold">ابدأ النسخ الآن -> /gateway/{domain}</button>
        </div>
      )}

      {mode==='upload' && (
        <div className="mt-6">
          <p>ارفع ملفات موقعك ZIP</p>
          <input type="file" className="w-full mt-2" />
          <button className="w-full mt-4 bg-yellow-500 text-black p-4 rounded-xl font-bold">ارفع وانشر على {domain}</button>
        </div>
      )}

      {mode==='create' && (
        <div className="mt-6">
          <button onClick={()=>window.location.href='/templates'} className="w-full bg-yellow-500 text-black p-4 rounded-xl font-bold">اختار قالب وابدأ على {domain}</button>
        </div>
      )}
    </div>
  )
}
