import { NextResponse } from "next/server";

function getReply(raw: string): string {
  const s = (raw || "").toLowerCase().trim();

  if (!s) return "اهلا يا ملك 👑\nاكتب: سعر - من انت - ماهو teos - كيف اشترك\nمباشر: https://wa.me/201006167293";

  if (s.includes("سعر") || s.includes("كم") || s.includes("بكام") || s.includes("cost") || s.includes("price") || s.includes("باقه") || s.includes("باقة") || s.includes("$") || s.includes("10") || s.includes("genesis")) {
    return "💰 الاسعار السيادية:\n• 5+ حروف: $10 لأول 100 (بعدها $30)\n• 4 حروف: $150\n• 3 حروف: $400\nGenesis $10 (~0.109 SOL) يفتح 100 اسم على 125 نطاق\nالدفع: SOL - فودافون كاش 01006167293 - بايبال elma7rosa@gmx.com\nhttps://wa.me/201006167293";
  }

  if (s.includes("ايمن") || s.includes("سيف") || s.includes("مؤسس") || s.includes("founder") || s.includes("من انت") || s.includes("who are you") || s.includes("who") || s.includes("مين")) {
    return "👑 انا KING TEOS - مساعد الملك\nالمؤسس: ايمن سيف - الاسكندرية - موقع الحفر 022\nAYMAN.TEOS & ELMAHROSA.TEOS تم سكهم على Solana Mainnet\nمباشر: https://wa.me/201006167293";
  }

  if (s.includes("teos") || s.includes("تيوس") || s.includes("ماهو") || s.includes("يعني ايه") || s.includes("web4") || s.includes("ويب4") || s.includes("what is") || s.includes("what's teos")) {
    return "🌍 TEOS = WEB4 Sovereign Root\nمش سوق دومينات - ده مفاتيح هوية سيادية.\n.teos هو المفتاح الجذري الالزامي لازم تشتريه الاول عشان تفتح اي دولة\nملكية ابدية في محفظتك على سولانا Metaplex Core - بدون تجديد";
  }

  if (s.includes("كيف") || s.includes("ازاي") || s.includes("اشترك") || s.includes("سجل") || s.includes("register") || s.includes("how")) {
    return "⚓ طريقة التسجيل:\n1- ابحث عن اسمك فوق\n2- اربط محفظة Phantom/Solflare\n3- اختار .teos الاول (الزامي)\n4- ادفع SOL او فودافون كاش 01006167293\n5- السك خلال 24 ساعة\nبعد .teos تقدر تفتح نفس الاسم على 124 دولة\nhttps://wa.me/201006167293";
  }

  if (s.includes("125") || s.includes("124") || s.includes("دولة") || s.includes("tld") || s.includes("نطاق") || s.includes("domain")) {
    return "🗺️ 125 مساحة:\n• 1 جذر: .teos (الزامي)\n• 124 دولة: .eg .sa .us .uk .id .fr\nالقاعدة: مفيش دولة تتفتح من غير .teos\nمثال: saloma.eg لازم saloma.teos الاول";
  }

  if (s.includes("مرحبا") || s.includes("hello") || s.includes("hi") || s.includes("سلام") || s.includes("اهلا")) {
    return "اهلا يا ملك 👑 في TEOS - الاسكندرية\n\nاسألني:\n• كم سعر النطاق؟\n• من انت؟\n• ماهو Teos؟\n• كيف اشترك؟\nمباشر: https://wa.me/201006167293";
  }

  return `سؤالك: "${raw}"\n\nTEOS جذر سيادي WEB4 - 125 نطاق - Genesis $10 - ملكية ابدية على سولانا.\nجرب: سعر، من انت، ماهو teos، كيف اشترك\nhttps://wa.me/201006167293`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // يقرا أي شكل: message, messages, prompt, input, text
    let raw = "";
    if (body.message) raw = body.message;
    else if (body.messages && Array.isArray(body.messages)) raw = body.messages[body.messages.length-1]?.content || body.messages[body.messages.length-1]?.text || "";
    else if (body.prompt) raw = body.prompt;
    else if (body.input) raw = body.input;
    else if (body.text) raw = body.text;
    else if (typeof body === "string") raw = body;

    return NextResponse.json({ reply: getReply(raw), text: getReply(raw), message: getReply(raw) });
  } catch {
    return NextResponse.json({ reply: "تواصل مباشر: https://wa.me/201006167293" });
  }
}