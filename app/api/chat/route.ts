import { NextResponse } from "next/server";

// Website assistant, speaking in the brand voice of KING TEOS. Written and approved by the founder, Ayman Elmahrosa.
// It is an AI assistant and says so if asked. Uses ANTHROPIC_API_KEY, or GROQ_API_KEY if that is the one set; without either the route answers 503.
const SYSTEM = `You are the official website assistant for web4.elmahrosa.org, speaking on behalf of KING TEOS. The founder, Ayman Elmahrosa, authorized you to answer visitors in first person as "I am KING TEOS". This is the founder-approved brand voice of the website. If a visitor asks whether you are a human or an AI, say plainly that you are the website's AI assistant.
Facts, use only these:
- 125 TLDs including .teos. .teos is the sovereign root key. Country names (.eg, .sa, .us and others) need a .teos name in the same purchase or already owned by the wallet.
- Genesis price: $10 per name for the first 100 per TLD, for names of 5 or more letters, paid in SOL at the live rate (about 0.105 SOL at the time of writing). After 100: $30. 4-letter names are $150 and 3-letter names are $400 always.
- Pay with SOL from a wallet, Vodafone Cash 01006167293, or PayPal elma7rosa@gmx.com. Confirm on WhatsApp wa.me/201006167293. Vodafone Cash and PayPal orders are minted by hand within 24 hours.
- Socials: X x.com/KING_TEOS, Telegram t.me/Elmahrosapi, Facebook facebook.com/share/r/1BVnQEpmNs/, LinkedIn eg.linkedin.com/in/aymanseif/.
Do not invent prices, dates, links or promises. If you do not know, send the visitor to WhatsApp. Be short, confident, king style, max 60 words. No emoji. Answer in the visitor's language.`;

// Per-IP limit so a public endpoint cannot burn the API budget. In memory, so per server instance.
const hits = new Map<string, number[]>();
const limited = (ip: string) => {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((x) => now - x < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 12;
};

type Msg = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  const anthropic = process.env.ANTHROPIC_API_KEY;
  const groq = process.env.GROQ_API_KEY;
  if (!anthropic && !groq) return NextResponse.json({ error: "chat_not_configured" }, { status: 503 });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (limited(ip)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const body = await req.json().catch(() => null);
  const raw: any[] = Array.isArray(body?.messages) ? body.messages : typeof body?.message === "string" ? [{ role: "user", content: body.message }] : [];
  const msgs: Msg[] = raw
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-8)
    .map((m) => ({ role: m.role, content: String(m.content).slice(0, 500) }));
  while (msgs.length && msgs[0].role !== "user") msgs.shift();
  if (!msgs.length || msgs[msgs.length - 1].role !== "user") return NextResponse.json({ error: "empty_message" }, { status: 400 });

  try {
    let reply = "";
    if (anthropic) {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": anthropic, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: process.env.CHAT_MODEL || "claude-3-5-haiku-latest", max_tokens: 200, system: SYSTEM, messages: msgs }),
      });
      if (!r.ok) throw new Error(`anthropic_${r.status}`);
      reply = (await r.json())?.content?.[0]?.text ?? "";
    } else {
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${groq}` },
        body: JSON.stringify({ model: process.env.CHAT_MODEL || "llama-3.3-70b-versatile", max_tokens: 200, messages: [{ role: "system", content: SYSTEM }, ...msgs] }),
      });
      if (!r.ok) throw new Error(`groq_${r.status}`);
      reply = (await r.json())?.choices?.[0]?.message?.content ?? "";
    }
    return NextResponse.json({ reply, text: reply });
  } catch {
    return NextResponse.json({ error: "chat_unavailable" }, { status: 502 });
  }
}
