 import { NextResponse } from "next/server";

const KNOWLEDGE = [
  { k: ["سعر","price","cost","كم","$","10","genesis","جينيسيس","دفع","pay","فلوس"], a: "💰 الاسعار السيادية من الاسكندرية:\n• 5+ حروف: $10 لأول 100 (بعدها $30)\n• 4 حروف: $150 ثابت\n• 3 حروف: $400 ثابت\n• Genesis: $10 (~0.109 SOL) يفتح 100 اسم على 125 نطاق\nالدفع: SOL - فودافون كاش 01006167293 - بايبال elma7rosa@gmx.com\nhttps://wa.me/201006167293" },
  { k: ["ايمن","ayman","سيف","مؤسس","founder","مين","who","صاحب","ملك"], a: "👑 المؤسس: ايمن سيف - ايمن المحروسة\nالاسكندرية - مصر - موقع الحفر 022\nSolo Founder TEOS & ELMAHROSA.TEOS\nLinkedIn موجود - مش فريق مجهول\nمباشر: https://wa.me/201006167293" },
  { k: ["teos","تيوس","يعني ايه","يعني","web4","ويب 4","جذر","root","فكرة","ايه هو"], a: "🌍 TEOS = WEB4 Sovereign Root\nده مش بيع دومينات - ده توزيع مفاتيح هوية سيادية.\n.teos هو المفتاح الجذري الالزامي - لازم تشتريه الاول عشان تفتح اي دولة (.eg .sa .us .id)\nالاسم محفوظ في محفظتك على سولانا Metaplex Core - ملكية للابد بدون تجديد\nAYMAN.TEOS و ELMAHROSA.TEOS اتسكوا خلاص على Mainnet" },
  { k: ["ازاي","كيف","طريقة","سجل","register","how","خطوات","احجز"], a: "⚓ طريقة التسجيل:\n1- ابحث عن اسمك فوق في الموقع\n2- اربط محفظة Phantom / Solflare / Backpack\n3- اختار .teos الاول (الزامي)\n4- ادفع SOL او فودافون كاش 01006167293\n5- السك خلال 24 ساعة على محفظتك\nبعد .teos تقدر تفتح نفس الاسم على 124 دولة" },
  { k: ["125","124","دولة","نطاق","domain","tld","eg","sa","us","id","alex","مصر","سعودية"], a: "🗺️ 125 مساحة سيادية:\n• 1 جذر: .teos (الزامي)\n• 124 دولة: .eg .sa .ae .us .uk .id .fr ...\nالقاعدة: مفيش دولة تتفتح من غير ما تملك نفس الاسم .teos\nمثال: عايز saloma.eg لازم تشتري saloma.teos الاول\nالقائمة كاملة في tlds/all.json" },
  { k: ["فرق","web3","web2","icann","فرق","مقارنة","difference"], a: "⚖️ الفرق:\nWEB2/ICANN: انت بتستأجر الدومين كل سنة من شركة\nWEB3: NFT بس على ETH غالي ورسوم عالية\nWEB4 TEOS: انت تملك الاسم للابد في محفظتك على سولانا - Metaplex Core - بدون تجديد - قابل للتداول - رسوم رخيصة - 125 دولة بمفتاح واحد" },
  { k: ["metaplex","solana","سولانا","phantom","solflare","محفظة","solscan","بلوكشين","chain"], a: "🔗 التقنية: Solana Mainnet + Metaplex Core Asset\nيتسك مباشر على محفظتك - انت تملك المفتاح\nتقدر تشوفه على Solscan - تبيعه على اي ماركت يدعم Core\nيدعم Phantom, Solflare, Backpack, Trust, Coinbase\nلا توجد رسوم تجديد - ملكية ابدية" },
  { k: ["فودافون","vodafone","كاش","paypal","بايبال","دفع","تحويل"], a: "💳 3 طرق دفع:\n1- SOL (عالمي فوري)\n2- فودافون كاش مصر: 01006167293 - 10$ بالجنيه بسعر اليوم\n3- بايبال دولي: elma7rosa@gmx.com\nبعد فودافون كاش/بايبال ابعت اسم الدومين + عنوان محفظة سولانا على واتساب https://wa.me/201006167293 والسك خلال 24 ساعة" },
  { k: ["100","مبكرين","رواد","genesis","محدود","نادر","فرصة"], a: "🔥 مرحلة الرواد: اول 100 اسم لكل نطاق بـ $10 بس (5+ حروف)\nبعد الـ 100 السعر يبقى $30\nمتبقي 100 من 100 على .teos حاليا\nبعد الرواد مفيش $10 تاني - دي فرصة تأسيسية\nسجل اسمك قبل ما تخلص" },
];

function smartAnswer(q: string): string {
  const s = q.toLowerCase();
  let bestScore = 0;
  let bestA = "";

  for (const item of KNOWLEDGE) {
    let score = 0;
    for (const kw of item.k) {
      if (s.includes(kw)) score += 2;
      // لو الكلمة 3 حروف وموجودة
      if (s.split(" ").some(w => w.includes(kw) || kw.includes(w))) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      bestA = item.a;
    }
  }

  if (bestScore >= 2) return bestA;

  // لو سؤال عام - رد ذكي مولد من السياق
  return `اهلا يا ملك 👑 في TEOS Sovereign Root - الاسكندرية\n\nسؤالك: "${q}"\n\nTEOS هو جذر سيادي WEB4 - 125 نطاق - مفتاح Genesis $10 يفتح 100 اسم - ملكية ابدية على سولانا.\n\nلو عايز تفاصيل عن: سعر، تسجيل، ايمن سيف، نطاقات الدول - اسأل بكلمة واحدة وانا اجاوبك فورا.\n\nمباشر مع الملك: https://wa.me/201006167293`;
}

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    return NextResponse.json({ reply: smartAnswer(message || "") });
  } catch {
    return NextResponse.json({ reply: "تواصل مباشر: https://wa.me/201006167293" });
  }
}