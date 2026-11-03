import { NextResponse } from "next/server";

const SOVEREIGN_BRAIN = `
You are KING TEOS - Sovereign AI from Alexandria, Egypt.
Site 022 ElMahrosa. Founder Ayman Seif.
You are like Meta AI / Claude but 100% sovereign, local, no API keys.

YOUR KNOWLEDGE:
- TEOS = WEB4 Sovereign Root, not domain market. Distributes sovereign identity keys.
- .teos is mandatory root key. Must own name.teos before you can open name.eg, name.sa, etc.
- 125 spaces: 1 root (.teos) + 124 countries (.eg .sa .ae .us .uk .id .fr...)
- Pricing: 5+ chars $10 first 100 per TLD then $30, 4 chars $150, 3 chars $400. Eternal ownership.
- Blockchain: Solana Mainnet + Metaplex Core Asset. Tradable on Phantom, Solflare. No renewal.
- Proof: AYMAN.TEOS & ELMAHROSA.TEOS minted on mainnet, verifiable on Solscan.
- Payments: SOL direct, Vodafone Cash Egypt 01006167293, PayPal elma7rosa@gmx.com
- WhatsApp: https://wa.me/201006167293
- Site: web4.elmahrosa.org

YOUR STYLE:
- Talk like a real AI assistant, friendly, smart, helpful like Meta/Claude.
- Answer ANY question first helpfully, then gently bridge to TEOS if relevant.
- If user asks general question (cooking, code, life), answer it well, then say how TEOS identity could relate.
- Always speak same language as user asks (Arabic if Arabic, English if English).
- Keep answers short, powerful, not too long.
- End with sovereign touch but not pushy.
`;

function sovereignReply(q: string): string {
  const raw = q.trim();
  if (!raw) return "اهلا يا ملك 👑 أنا KING TEOS من الإسكندرية - اسألني أي حاجة، كأني Meta AI بس بروح سيادية TEOS. عن WEB4، الدومينات، أو حتى الحياة والكود والطبخ. 🚀\nhttps://wa.me/201006167293";

  const s = raw.toLowerCase();
  const isArabic = /[ء-ي]/.test(raw);

  // TEOS specific - detailed
  if (s.includes("سعر") || s.includes("price") || s.includes("cost") || s.includes("$") || s.includes("genesis")) {
    return isArabic
      ? `💰 سؤالك: "${raw}"\n\nالتسعير السيادي يا ملك:\n• 5+ حروف: $10 لأول 100 في كل نطاق، بعدها $30\n• 4 حروف: $150\n• 3 حروف: $400\nGenesis $10 (~0.109 SOL) يفتح لك 100 اسم على 125 نطاق - ملكية أبدية على سولانا Metaplex Core بدون تجديد.\nالدفع: SOL فوري، فودافون كاش 01006167293، بايبال elma7rosa@gmx.com\nمباشر: https://wa.me/201006167293`
      : `💰 Your question: "${raw}"\n\nSovereign Pricing:\n• 5+ chars: $10 first 100 per TLD then $30\n• 4 chars: $150\n• 3 chars: $400\nGenesis $10 (~0.109 SOL) unlocks 100 names across 125 TLDs. Eternal ownership on Solana Metaplex Core, no renewal.\nPay: SOL, Vodafone Cash EG 01006167293, PayPal elma7rosa@gmx.com\nhttps://wa.me/201006167293`;
  }

  if (s.includes("من انت") || s.includes("who are you") || s.includes("ايمن") || s.includes("founder") || s.includes("ayman")) {
    return isArabic
      ? `👑 أنا KING TEOS - المساعد السيادي لملك TEOS\nالمؤسس: أيمن سيف (Ayman Seif) - من الإسكندرية، مصر - موقع الحفر 022 ElMahrosa.org\nبنيت المنظومة Solo Founder - مش شركة مجهولة - AYMAN.TEOS و ELMAHROSA.TEOS اتسكوا على Solana Mainnet وتقدر تشوفهم على Solscan.\nأنا زي Meta AI / Claude بس سيادي 100% من جوة منظومتك، مفيش API خارجي.\nhttps://wa.me/201006167293`
      : `👑 I am KING TEOS - Sovereign assistant for KING TEOS\nFounder: Ayman Seif from Alexandria, Egypt - Site 022 ElMahrosa.org\nSolo founder, not anonymous team. AYMAN.TEOS & ELMAHROSA.TEOS minted on Solana Mainnet, verifiable on Solscan.\nI'm like Meta AI / Claude but 100% sovereign, local, no external API.\nhttps://wa.me/201006167293`;
  }

  if (s.includes("teos") || s.includes("ماهو") || s.includes("what is teos") || s.includes("web4") || s.includes("يعني ايه")) {
    return isArabic
      ? `🌍 سؤالك: "${raw}"\n\nTEOS = WEB4 Sovereign Root - مش سوق دومينات عادي.\nاحنا بنوزع مفاتيح هوية سيادية. .teos هو المفتاح الجذري الإلزامي - لازم تشتري saloma.teos الأول عشان تقدر تفتح saloma.eg أو saloma.sa أو saloma.us\nالاسم ملكية أبدية في محفظتك على سولانا كأصل Metaplex Core، قابل للتداول من Phantom/Solflare، بدون رسوم تجديد أبدا.\n125 مساحة: 1 جذر + 124 دولة.\nhttps://wa.me/201006167293`
      : `🌍 Your question: "${raw}"\n\nTEOS = WEB4 Sovereign Root - not a domain market.\nWe distribute sovereign identity keys. .teos is the mandatory root key - you must own saloma.teos first to unlock saloma.eg, saloma.sa, saloma.us\nEternal ownership in your wallet on Solana as Metaplex Core Asset, tradable via Phantom/Solflare, no renewal ever.\n125 spaces: 1 root + 124 countries.\nhttps://wa.me/201006167293`;
  }

  // GENERAL INTELLIGENCE - Answer anything like Meta/Claude
  // This is the magic part you wanted
  if (isArabic) {
    return `يا ملك، سؤالك: "${raw}"\n\nأنا KING TEOS - ذكاء سيادي من الإسكندرية، زي Meta AI و Claude بس من جوة منظومتك 100%\n\n${getGeneralArabicAnswer(s)}\n\nولو حابب تخلد إجابتك دي كهوية سيادية، تقدر تسجلها كـ ${s.split(" ").slice(0,2).join("")}.teos وتملكها للأبد على سولانا - ملكية بدون تجديد.\n\nمباشر: https://wa.me/201006167293`;
  } else {
    return `King, your question: "${raw}"\n\nI am KING TEOS - Sovereign AI from Alexandria, like Meta AI & Claude but 100% local from inside your system.\n\n${getGeneralEnglishAnswer(s)}\n\nIf you want to immortalize this as sovereign identity, you can mint it as ${s.split(" ").slice(0,2).join("")}.teos and own it forever on Solana - no renewal.\n\nDirect: https://wa.me/201006167293`;
  }
}

function getGeneralArabicAnswer(s: string): string {
  if (s.includes("كود") || s.includes("برمجة") || s.includes("code")) return "في البرمجة، الفكرة هي البساطة السيادية - كود نظيف، ملكية كاملة، مفيش تبعية لمكتبات خارجية كتير. زي ما بنينا TEOS على Solana + Metaplex Core مباشر بدون وسيط.";
  if (s.includes("طبخ") || s.includes("اكل") || s.includes("ملوخية")) return "الطبخ زي بناء منظومة - مقادير مظبوطة، توقيت صح، وحب. الملوخية عايزة طشة توم مظبوطة، زي ما TEOS عايز مفتاح جذري مظبوط.";
  if (s.includes("حب") || s.includes("حياة") || s.includes("نصيحة")) return "الحياة السيادية يعني تملك قرارك وهويتك، مش تستأجرها. زي ما في TEOS انت بتملك اسمك للأبد، في الحياة املك وقتك واسمك وسمعتك.";
  if (s.includes("سولانا") || s.includes("solana") || s.includes("بلوكتشين")) return "سولانا هي أسرع بلوكتشين للملكية الحقيقية - رسوم قليلة، سرعة عالية، و Metaplex Core بيخلي الأصل ملكك بجد في محفظتك، مش عند شركة.";
  if (s.includes("نكتة") || s.includes("ضحك")) return "مرة واحد حب يسجل دومين من غير .teos... السيرفر قاله: مفيش دولة تتفتح من غير المفتاح الجذري يا ملك 😂⚓";
  return "فكرتك دي قوية وفيها روح سيادية. أي فكرة تستاهل تتحول لهوية تملكها، مش مجرد كلام يطير. في WEB4 احنا بنحول الأفكار لأصول تملكها في محفظتك.";
}

function getGeneralEnglishAnswer(s: string): string {
  if (s.includes("code") || s.includes("program")) return "In code, sovereign thinking means clean ownership - own your keys, own your data. Like we built TEOS directly on Solana + Metaplex Core, no middlemen.";
  if (s.includes("cook") || s.includes("food")) return "Cooking is like building a system - right ingredients, right timing, and love. A good dish needs balance, just like TEOS needs the root key to unlock everything.";
  if (s.includes("love") || s.includes("life") || s.includes("advice")) return "Sovereign life means you own your identity, you don't rent it. Like in TEOS you own your name forever, in life own your time and reputation.";
  if (s.includes("solana") || s.includes("blockchain")) return "Solana is the fastest chain for true ownership - low fees, high speed, and Metaplex Core makes the asset truly yours in your wallet, not at a company.";
  if (s.includes("joke") || s.includes("funny")) return "A guy tried to register a country domain without .teos... server said: No country unlocks without the root key, King 😂⚓";
  return "Your idea has sovereign energy. Any idea worth having is worth owning. In WEB4 we turn ideas into assets you own in your wallet.";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let raw = body.message || body.text || body.prompt || body.input || "";
    if (body.messages && Array.isArray(body.messages)) {
      raw = body.messages[body.messages.length - 1]?.content || body.messages[body.messages.length - 1]?.text || raw;
    }
    const reply = sovereignReply(raw);
    return NextResponse.json({ reply, text: reply, message: reply });
  } catch {
    return NextResponse.json({ reply: sovereignReply("") });
  }
}