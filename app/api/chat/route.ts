import { NextResponse } from "next/server";

function getAnswer(q: string): string {
  const s = q.toLowerCase().trim();
  if (!s || s === "hi" || s === "h8" || s === "hello" || s.includes("هلا") || s.includes("سلام") || s.includes("مرحبا")) {
    return "اهلا يا ملك 👑 في TEOS Sovereign Root\nمن الاسكندرية - مصر\n\nاسألني:\n• سعر؟\n• ايمن سيف؟\n• يعني ايه TEOS؟\n\nمباشر: https://wa.me/201006167293";
  }
  if (s.includes("سعر") || s.includes("price") || s.includes("$") || s.includes("cost") || s.includes("كم") || s.includes("125") || s.includes("10g")) {
    return "الاسعار السيادية:\n• 5+ حروف: $30\n• 4 حروف: $150\n• 3 حروف: $400\n• المفتاح الملكي: $10 يفتح 100 اسم\n\nhttps://wa.me/201006167293";
  }
  if (s.includes("ايمن") || s.includes("ayman") || s.includes("مؤسس") || s.includes("founder") || s.includes("محروسة") || s.includes("elmahrosa")) {
    return "المؤسس الوحيد: ايمن سيف - ايمن المحروسة\nمن الاسكندرية\nSolo Founder TEOS & ELMAHROSA.TEOS\nhttps://wa.me/201006167293";
  }
  if (s.includes("teos") || s.includes("تيوس") || s.includes("web4") || s.includes("tld") || s.includes("domain")) {
    return "TEOS = انت تملك اسمك للابد\nمحفوظ في محفظتك على سولانا Metaplex Core\nمفيش تجديد سنوي - 125 TLD\nhttps://wa.me/201006167293";
  }
  return "انا KING TEOS المساعد السيادي 👑\nاسأل: سعر، مؤسس، TEOS\nاو كلم الملك مباشر:\nhttps://wa.me/201006167293";
}

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    return NextResponse.json({ reply: getAnswer(message || "") });
  } catch {
    return NextResponse.json({ reply: "تواصل: https://wa.me/201006167293" });
  }
}