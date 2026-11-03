import { NextResponse } from "next/server";

function getReply(q: string): string {
  const s = q.toLowerCase().trim();

  if (!s) return "اهلا يا ملك 👑 اسألني: سعر، تسجيل، TEOS، مؤسس\nمباشر: https://wa.me/201006167293";

  // 1 - سعر
  if (/(سعر|كم|بكام|price|cost|genesis|جينيسيس|\$|باقه|باقة|10)/.test(s)) {
    return "💰 الاسعار السيادية - الاسكندرية:\n• 5+ حروف: $10 لأول 100 (بعدها $30)\n• 4 حروف: $150\n• 3 حروف: $400\n• Genesis $10 (~0.109 SOL) يفتح 100 اسم على 125 نطاق\nالدفع: SOL - فودافون كاش 01006167293 - بايبال elma7rosa@gmx.com\nمباشر: https://wa.me/201006167293";
  }

  // 2 - مؤسس / من انت
  if (/(ايمن|سيف|مؤسس|founder|من انت|who are you|مين انت|صاحب|ملك)/.test(s)) {
    return "👑 انا KING TEOS - مساعد الملك\nالمؤسس: ايمن سيف - ايمن المحروسة\nمن الاسكندرية - مصر - موقع الحفر 022\nSolo Founder - AYMAN.TEOS & ELMAHROSA.TEOS تم سكهم على Solana Mainnet\nمباشر: https://wa.me/201006167293";
  }

  // 3 - TEOS ماهو
  if (/(ماهو|يعني ايه|what is|teos|تيوس|web4|ويب4|فكرة)/.test(s)) {
    return "🌍 TEOS = WEB4 Sovereign Root\nمش سوق دومينات - ده توزيع مفاتيح هوية سيادية.\n.teos هو المفتاح الجذري الالزامي - لازم تشتريه الاول عشان تفتح اي دولة\nالاسم ملكية ابدية في محفظتك على سولانا Metaplex Core - بدون تجديد\nAYMAN.TEOS و ELMAHROSA.TEOS اتسكوا خلاص";
  }

  // 4 - كيف اشترك / طريقة
  if (/(كيف|ازاي|طريقة|اشترك|سجل|register|how to|احجز)/.test(s)) {
    return "⚓ طريقة التسجيل:\n1- ابحث عن اسمك فوق في الموقع\n2- اربط محفظة Phantom/Solflare\n3- اختار .teos الاول (الزامي)\n4- ادفع SOL او فودافون كاش 01006167293\n5- السك خلال 24 ساعة\nبعد .teos تقدر تفتح نفس الاسم على 124 دولة\nhttps://wa.me/201006167293";
  }

  // 5 - نطاقات / دول
  if (/(125|124|دولة|نطاق|tld|قائمة|all\.json)/.test(s)) {
    return "🗺️ 125 مساحة سيادية:\n• 1 جذر: .teos (الزامي)\n• 124 دولة: .eg .sa .ae .us .uk .id .fr\nالقاعدة: مفيش دولة تتفتح من غير ما تملك نفس الاسم .teos\nمثال: عايز saloma.eg لازم saloma.teos الاول\nالقائمة: tlds/all.json";
  }

  // ترحيب
  if (/(مرحبا|hello|hi|سلام|اهلا)/.test(s)) {
    return "اهلا يا ملك 👑 في TEOS Sovereign Root - الاسكندرية\n\nاسألني:\n• كم سعر النطاق؟\n• من انت؟\n• ماهو Teos؟\n• كيف اشترك؟\n\nمباشر: https://wa.me/201006167293";
  }

  // fallback ذكي - يرد حسب السؤال نفسه
  return `اهلا يا ملك 👑 سؤالك: "${q}"\n\nTEOS جذر سيادي WEB4 - 125 نطاق - Genesis $10 يفتح 100 اسم - ملكية ابدية على سولانا.\n\nجرب تسأل: سعر، من انت، ماهو Teos، كيف اشترك\nمباشر: https://wa.me/201006167293`;
}

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    return NextResponse.json({ reply: getReply(message || "") });
  } catch {
    return NextResponse.json({ reply: "تواصل مباشر: https://wa.me/201006167293" });
  }
}