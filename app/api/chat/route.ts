import { NextResponse } from "next/server";

function getUser(b:any){
  const w=b.wallet||b.walletAddress||"";
  const t=b.teosName||b.name||"";
  return {
    ok:!!w||!!t,
    label:t||(w?w.slice(0,4)+".."+w.slice(-4):""),
    isFounder:t.toLowerCase().includes("ayman")
  };
}

function chat(q:string, u:ReturnType<typeof getUser>){
  const raw=q.trim();
  const s=raw.toLowerCase();

  // سياج - لو مش رابط محفظة ما يردش
  if(!u.ok){
    return "🔒 الشات السيادي للمُلاك فقط - اربط محفظتك\nاربط Phantom اللي فيها .teos واسألني في TEOS - web4.elmahrosa.org";
  }

  const hi = u.isFounder ? `مرحبا أيمن - مؤسس TEOS` : u.label ? `مرحبا ${u.label}` : "مرحبا";
  
  if(!raw || raw.length<=3) return `${hi} - اسألني: عايز دومين بس ولا المنظومة الكاملة؟`;

  // الأسعار الحالية حسب طول الاسم
  if(s.match(/10|١٠|عشرة|دولار|سعر|price|بكام|genesis|تأسيس|مؤسس|found/)){
    return `${hi}، 💰 الأسعار الحالية:

- حرف واحد: $2,000
- حرفان أو 3 أحرف: $400
- 4 أحرف: $150
- 5 أحرف فأكثر: $30

ملكية Metaplex Core على Solana - بدون رسوم تجديد.
الدفع المتاح حاليًا: SOL عبر محفظة Solana.`;
  }
  // مسار دومين بس
  if(s.match(/دومين بس|مش منظومة|تداول|تسطيب|ديزاين|setup|trade|design|بيع/)){
    return `${hi}، تقدر تاخد الدومين بس - name.teos أصل في محفظتك على Solana
تسطبه - تتداوله من Phantom - تعمل عليه ديزاين - تبيعه - ملكك للأبد
احنا نوفر المتصفح والجيت واي لما تحتاجه - مش إجباري تخش المنظومة دلوقتي`;
  }

  // مسار منظومة كاملة
  if(s.match(/منظومة|نظام كامل|متصفح|جيت واي|browser|gateway|system|كاملة/)){
    return `${hi}، عايز المنظومة الكاملة؟ .teos هو المفتاح والبداية
مفتاح واحد يفتح 124 دولة - saloma.teos يفتح saloma.eg / sa / us
بعدها المتصفح السيادي والجيت واي - تبني عالمك على TEOS - من إسكندرية - web4.elmahrosa.org`;
  }

  // Freename
  if(s.match(/freename|ens|unstopp|فرق|مقارنة/)){
    return `${hi}، Freename سوق مفتوح - أي حد يعمل TLD - إيجار سنوي - يصطدم مع ICANN
TEOS جذر واحد مقفول .teos - قاعدة سيادية: لازم تملك name.teos عشان تفتح name.eg - ملكية أبدية بدون تجديد - بوابة منظومة كاملة`;
  }

  // ماذا بعد
  if(s.match(/بعد|after|ماذا بعد|what next/)){
    return `${hi}، بعد ما تملك .teos ينفتح لك 124 دولة: name.eg - name.sa - name.ae - name.us
كل واحدة أصل منفصل في محفظتك - ملكية أبدية - تقدر تسطب - تتداول - تدخل المنظومة`;
  }

  return `${hi} - عندك مسارين:
1. دومين بس: تملكه - تسطبه - تتداوله - ديزاين - ملكك للأبد
2. منظومة كاملة: نفس المفتاح يفتح 124 دولة + متصفح + جيت واي
اسألني: عايز دومين ولا منظومة؟`;
}

export async function POST(req:Request){
  try{
    const b=await req.json();
    let raw=b.message||b.text||b.prompt||"";
    if(b.messages?.length) raw=b.messages[b.messages.length-1]?.content||raw;
    const u=getUser(b);
    const r=chat(raw,u);
    return NextResponse.json({reply:r,text:r});
  }catch{
    return NextResponse.json({reply:"🔒 اربط محفظتك - الشات للمُلاك فقط"});
  }
}