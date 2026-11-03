 import { NextResponse } from "next/server";

const KNOWLEDGE: Record<string, string> = {
  price: "الاسعار السيادية: 5+ حروف $30 | 4 حروف $150 | 3 حروف $400 - المفتاح $10",
  founder: "المؤسس الوحيد هو ايمن سيف - ايمن المحروسة من الاسكندرية. Solo Founder of TEOS & ELMAHROSA.TEOS",
  teos: "TEOS يعني انت تملك اسمك للابد، محفوظ في محفظتك على سولانا Metaplex Core، مفيش تجديد سنوي.",
};

function getAnswer(q: string): string {
  q = q.toLowerCase();
  if (q.includes("سعر") || q.includes("price") || q.includes("$") || q.includes("كم")) return KNOWLEDGE.price;
  if (q.includes("ايمن") || q.includes("ayman") || q.includes("مؤسس") || q.includes("founder") || q.includes("محروسة")) return KNOWLEDGE.founder;
  if (q.includes("teos") || q.includes("تيوس") || q.includes("web4") || q.includes("domain")) return KNOWLEDGE.teos;
  return `تواصل مباشر مع الملك على واتساب: https://wa.me/201006167293 - هو الوحيد اللي يرد`;
}

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    const answer = getAnswer(message || "");
    return NextResponse.json({ reply: answer });
  } catch (e) {
    return NextResponse.json({ reply: "تواصل على https://wa.me/201006167293" });
  }
}
