 import { NextResponse } from "next/server";

function getAnswer(q: string): string {
  const s = q.toLowerCase();

  // 1- سعر الاول
  if (s.includes("سعر") || s.includes("price") || s.includes("$") || s.includes("cost") || s.includes("كم") || s.includes("125") || s.includes("10g") || s.includes("genesis") || s.includes("جينيسيس") || s.includes("دفع")) {
    return "الاسعار السيادية TEOS:\n• 5+ حروف: $30\n• 4 حروف: $150\n• 3 حروف: $400\n• المفتاح التأسيسي Genesis: $10 (~0.109 SOL)\nيفتح 100 اسم على 125 نطاق\nhttps://wa.me/201006167293";
  }
  // 2- المؤسس الثاني
  if (s.includes("ايمن") || s.includes("ayman") || s.includes("سيف") || s.includes("مؤسس") || s.includes("founder") || s.includes("محروسة") || s.includes("elmahrosa")) {
    return "المؤسس الوحيد: ايمن سيف - ايمن المحروسة\nمن الاسكندرية - مصر\nSolo Founder of TEOS & ELMAHROSA.TEOS - WEB4\nhttps://wa.me/201006167293";
  }
  // 3- يعني ايه TEOS الثالث
  if (s.includes("teos") || s.includes("تيوس") || s.includes("web4") || s.includes("ويب 4") || s.includes("يعني ايه") || s.includes("domain") || s.includes("نطاق") || s.includes("125")) {
    return "TEOS = WEB4 Sovereign Root\nانت تملك اسمك للابد محفوظ في محفظتك على سولانا Metaplex Core\nمفيش تجديد سنوي - 125 TLD - بنية هوية سيادية للجيل القادم\nhttps://wa.me/201006167293";
  }
  // 4- ترحيب في الاخر بس لو مفيش كلمة مفتاحية
  return "اهلا يا ملك 👑 في TEOS Sovereign Root\nمن الاسكندرية - مصر\n\nاسألني:\n• سعر؟\n• ايمن سيف؟\n• يعني ايه TEOS؟\n\nمباشر: https://wa.me/201006167293";
}

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    return NextResponse.json({ reply: getAnswer(message || "") });
  } catch {
    return NextResponse.json({ reply: "تواصل مباشر: https://wa.me/201006167293" });
  }
}