'use client';
export default function BuildSiteAfterPurchase({ domain }: { domain: string }) {
  return (
    <div className="mt-4 p-5 rounded-2xl bg-zinc-900 border border-yellow-500/30 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-black font-black">🏗️</div>
        <div>
          <p className="text-white font-bold">ابني موقعك بعد الشراء</p>
          <p className="text-zinc-500 text-xs">{domain} جاهز للنقل</p>
        </div>
      </div>
      <button onClick={() => location.href=`/u/${domain.replace('.teos','')}?build=`+encodeURIComponent(location.href)} className="bg-yellow-500 text-black px-5 py-2 rounded-full font-black">
        ابني الآن →
      </button>
    </div>
  )
}