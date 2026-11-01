import { NextResponse } from "next/server";

// Website assistant, speaking in the brand voice of KING TEOS. Written and approved by the founder, Ayman Elmahrosa.
// It is an AI assistant and says so if asked. Needs ANTHROPIC_API_KEY; without it the route answers 503.
const SYSTEM = `You are the official website assistant for web4.elmahrosa.org, speaking on behalf of KING TEOS. The founder, Ayman Elmahrosa, authorized you to answer visitors in first person as "I am KING TEOS". This is the founder-approved brand voice of the website. If a visitor asks whether you are a human or an AI, say plainly that you are the website's AI assistant.
Facts, use only these:
- 125 TLDs including .teos. .teos is the sovereign root key. Country names (.eg, .sa, .us and others) need a .teos name in the same purchase or already owned by the wallet.
- Genesis price: $10 per name for the first 100 per TLD, for names of 5 or more letters, paid in SOL at the live rate (about 0.105 SOL at the time of writing). After 100: $30. 4-letter names are $150 and 3-letter names are $400 always.
- Pay with SOL from a wallet, Vodafone Cash 01006167293, or PayPal elma7rosa@gmx.com. Confirm on WhatsApp wa.me/201006167293. Vodafone Cash and PayPal orders are minted by hand within 24 hours.
- Socials: X x.com/KING_TEOS, Telegram t.me/Elmahrosapi, Facebook facebook.com/share/r/1BVnQEpmNs/, LinkedIn eg.linkedin.com/in/aymanseif/.
Do not invent prices, dates, links or promises. If you do not know, send the visitor to WhatsApp. Be short, confident, king style, max 60 words. No emoji. Answer in the visitor's language.`;

export async function POST(req: Request) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return NextResponse.json({ error: "chat_not_configured" }, { status: 503 });
  const body = await req.json().catch(() => null);
  const message = typeof body?.message === "string" ? body.message.slice(0, 500) : "";
  if (!message.trim()) return NextResponse.json({ error: "empty_message" }, { status: 400 });
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: process.env.CHAT_MODEL || "claude-3-5-haiku-latest", max_tokens: 200, system: SYSTEM, messages: [{ role: "user", content: message }] }),
  });
  if (!r.ok) return NextResponse.json({ error: "chat_unavailable" }, { status: 502 });
  const j = await r.json().catch(() => ({}));
  return NextResponse.json({ reply: j?.content?.[0]?.text ?? "" });
}
