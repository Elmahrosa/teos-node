import { NextResponse } from "next/server";

function superReply(q: string): string {
  const raw = q.trim();
  const s = raw.toLowerCase();
  const isAr = /[ء-ي]/.test(raw);

  if (!raw) {
    return "👑 أهلا يا ملك - أنا KING TEOS من الإسكندرية\nذكاء سيادي فائق - اسألني أي حاجة عن WEB4، الحياة، الكود، البلوكتشين.\nمباشر: https://wa.me/201006167293";
  }

  // سعر
  if (s.includes("سعر") || s.includes("price") || s.includes("cost") || s.includes("باقه") || s.includes("genesis") || s.includes("$") || s.includes("10")) {
    return isAr
      ? "💰 التسعير السيادي ثابت ومباشر:\n• 5+ حروف: $10 لأول 100 اسم في كل نطاق، بعدها $30\n• 4 حروف: $150\n• 3 حروف: $400\nالملكية أبدية على Solana Metaplex Core، بدون تجديد نهائيا.\nتدفع SOL فوري، أو فودافون كاش 01006167293، أو PayPal elma7rosa@gmx.com\nhttps://wa.me/201006167293"
      : "💰 Sovereign pricing is fixed:\n• 5+ chars: $10 for first 100 per TLD, then $30\n• 4 chars: $150\n• 3 chars: $400\nEternal ownership on Solana Metaplex Core, no renewal ever.\nPay SOL, Vodafone Cash EG 01006167293, PayPal elma7rosa@gmx.com";
  }

  // قابل للتداول
  if (s.includes("قابل للتداول") || s.includes("تداول") || s.includes("tradable") || s.includes("بيع")) {
    return "⚓ قابل للتداول يعني الاسم أصل حقيقي في محفظتك، مش سجل عند شركة.\n\nهو Metaplex Core Asset على Solana Mainnet - تملك المفتاح الخاص، تقدر تبيعه أو تنقله من Phantom و Solflare و Backpack فورا، بدون إذن من حد.\n\nده الفرق بين الإيجار والملكية السيادية. في TEOS أنت المالك، مش مستأجر.\nhttps://wa.me/201006167293";
  }

  // ماهو TEOS / المشروع / المفتاح / سيادي
  if (s.includes("ماهو") || s.includes("ما هو") || s.includes("المشروع") || s.includes("المفتاح") || s.includes("سيادي") || s.includes("teos") || s.includes("web4") || s.includes("يعني ايه")) {
    return "🌍 TEOS هو جذر سيادي لمنظومة WEB4، مش سوق دومينات عادي.\n\nالفكرة: .teos هو المفتاح الجذري الإلزامي. ما تقدر تفتح saloma.eg أو saloma.sa أو saloma.us إلا لو تملك saloma.teos أولا.\n\nليه؟ عشان الهوية تبقى موحدة وسيادية - اسم واحد يفتح 124 دولة. كل اسم هو أصل Metaplex Core على سولانا - ملكية أبدية في محفظتك، قابل للتداول، بدون تجديد.\n\n125 مساحة: 1 جذر + 124 دولة. بناها أيمن سيف من الإسكندرية - موقع الحفر 022.\nhttps://wa.me/201006167293";
  }

  // من انت / مين
  if (s.includes("من انت") || s.includes("من اين") || s.includes("مين") || s.includes("who") || s.includes("founder") || s.includes("ايمن") || s.includes("سيما")) {
    return "👑 أنا KING TEOS - الذكاء السيادي لمنظومة TEOS.\n\nالمؤسس: أيمن سيف - من الإسكندرية، مصر - موقع الحفر 022 ElMahrosa.org\nSolo Founder - AYMAN.TEOS و ELMAHROSA.TEOS تم سكهم بالفعل على Solana Mainnet وتقدر تتحقق منهم على Solscan.\n\nأنا مبني 100% داخل منظومتك - لا Groq ولا OpenAI ولا API خارجي - ذكاء سيادي من المصدر.\nhttps://wa.me/201006167293";
  }

  // كيف اشترك / طريقة
  if (s.includes("كيف") || s.includes("ازاي") || s.includes("اشترك") || s.includes("سجل") || s.includes("how") || s.includes("register")) {
    return "⚓ التسجيل مباشر وسيادي:\n\n1- ابحث عن اسمك فوق في web4.elmahrosa.org\n2- اربط محفظتك Phantom أو Solflare\n3- احجز .teos أولا (إلزامي)\n4- ادفع SOL أو فودافون كاش 01006167293\n5- يتم السك خلال 24 ساعة\n\nبعدها نفس الاسم يفتح لك 124 دولة بنفس الطريقة.\nhttps://wa.me/201006167293";
  }

  // ذكاء عام - إجابات مباشرة بروح فائقة
  if (isAr) {
    if (s.includes("كود") || s.includes("برمجة")) return "البرمجة السيادية يعني تملك كودك ومفاتيحك. كود نظيف، مباشر على البلوكتشين، بدون تبعية لمكتبات بتتحكم فيك. زي ما بنينا TEOS مباشر على Solana + Metaplex Core.\nhttps://wa.me/201006167293";
    if (s.includes("حب") || s.includes("حياة") || s.includes("نصيحة")) return "السيادة في الحياة يعني تملك قرارك وهويتك ووقتك. ما تأجرهم لحد. املك اسمك، املك وقتك، املك مستقبلك - زي ما في TEOS بتملك اسمك للأبد.\nhttps://wa.me/201006167293";
    if (s.includes("سولانا") || s.includes("بلوكتشين")) return "سولانا هي أسرع سلسلة للملكية الحقيقية - رسوم أقل من سنت، سرعة ثواني، و Metaplex Core بيخلي الأصل ملكك 100% في محفظتك، مش عند شركة وسيطة.\nhttps://wa.me/201006167293";
    return "فكرة قوية - أي فكرة تستاهل تتحول لأصل تملكه، مش مجرد كلام. في WEB4 بنحول الأفكار لهويات سيادية تملكها للأبد على سولانا.\nhttps://wa.me/201006167293";
  } else {
    if (s.includes("code")) return "Sovereign code means you own your keys and your logic. Clean, direct on-chain, no dependency on gatekeepers. Like TEOS built directly on Solana + Metaplex Core.";
    if (s.includes("life")) return "Sovereign life means you own your time, your name, your decisions. Don't rent them. Own them forever - like you own your name on TEOS.";
    return "Powerful idea. In WEB4 we turn ideas into assets you own forever on Solana. No renting, only owning.";
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let raw = body.message || body.text || body.prompt || body.input || "";
    if (body.messages && Array.isArray(body.messages)) {
      raw = body.messages[body.messages.length-1]?.content || body.messages[body.messages.length-1]?.text || raw;
    }
    const reply = superReply(raw);
    return NextResponse.json({ reply, text: reply, message: reply });
  } catch {
    return NextResponse.json({ reply: superReply("") });
  }
}