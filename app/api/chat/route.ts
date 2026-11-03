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

  // 10$ مؤسسين
  if(s.match(/10|١٠|عشرة|دولار|سعر|price|بكام|genesis|تأسيس|مؤسس|found/)){
    return `${hi}، 💰 التسعير السيادي:

10$ للمؤسسين الـ 100 المقفولين فقط (5+ حروف) ~0.109 SOL
العشرة دولار دول للمؤسسين اللي احنا قافلين عليهم

بعد أول 100:
- 5+ حروف: $30
- 4 حروف: $150
- 3 حروف: $400

ملكية أبدية Metaplex Core على Solana - بدون تجديد - قابلة للتداول من Phantom - موثقة على Solscan
الدفع: SOL / فودافون كاش 01006167293 / PayPal elma7rosa@gmx.com`;
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
TEOS جذر واحد مقفول .teos - قاعدة سيادية: لازم تملك name.teos عشان تفتح name.eg - ملكية أبدية بدون تجديد - بوابة منظومة كاملة - 10$ مقفولة على 100 مؤسس`;
  }

  // ماذا بعد
  if(s.match(/بعد|after|ماذا بعد|what next/)){
    return `${hi}، بعد ما تملك .teos ينفتح لك 124 دولة: name.eg - name.sa - name.ae - name.us
كل واحدة أصل منفصل في محفظتك - ملكية أبدية - تقدر تسطب - تتداول - تدخل المنظومة`;
  }

  return `${hi} - عندك مسارين:
1. دومين بس: تملكه - تسطبه - تتداوله - ديزاين - ملكك للأبد
2. منظومة كاملة: نفس المفتاح يفتح 124 دولة + متصفح + جيت واي
اسألني: عايز دومين ولا منظومة؟ - 10$ للمؤسسين الـ 100 المقفولين`;
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