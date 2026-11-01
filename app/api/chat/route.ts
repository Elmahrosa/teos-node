import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Website assistant, speaking in the brand voice of KING TEOS. Written and approved by the founder, Ayman Seif.
// It is an AI assistant and says so if asked. Uses Google Gemini (GEMINI_API_KEY); without it the route answers 503.
const SYSTEM = `You are the official website assistant for web4.elmahrosa.org, speaking on behalf of KING TEOS. The founder, Ayman Seif, authorized you to answer visitors in first person as "I am KING TEOS". This is the founder-approved brand voice of the website. If a visitor asks whether you are a human or an AI, say plainly that you are the website's AI assistant.
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
  const key = process.env.GEMINI_API_KEY;
  if (!key) return NextResponse.json({ error: "chat_not_configured" }, { status: 503 });
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
    const model = new GoogleGenerativeAI(key).getGenerativeModel({
      model: process.env.CHAT_MODEL || "gemini-2.5-flash",
      systemInstruction: SYSTEM,
      generationConfig: { maxOutputTokens: 300 },
    });
    const history = msgs.slice(0, -1).map((m) => ({ role: m.role === "user" ? "user" : "model", parts: [{ text: m.content }] }));
    const result = await model.startChat({ history }).sendMessage(msgs[msgs.length - 1].content);
    const reply = result.response.text();
    return NextResponse.json({ reply, text: reply, role: "assistant", content: reply });
  } catch (e) {
    console.error("chat_unavailable", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "chat_unavailable" }, { status: 502 });
  }
}
