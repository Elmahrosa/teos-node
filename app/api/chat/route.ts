import { NextResponse } from "next/server";
import { PRICE_TIERS, LENGTH_LABELS } from "../../../lib/pricing";
import { checkRateLimit, rateLimitResponse } from "../../../lib/rate-limit";

// Display only. Nothing the client sends here ever grants a title or privilege.
function getUser(b: any) {
  const w = typeof b.wallet === "string" ? b.wallet : typeof b.walletAddress === "string" ? b.walletAddress : "";
  const t = typeof b.teosName === "string" ? b.teosName : typeof b.name === "string" ? b.name : "";
  const safeName = /^[a-z0-9-]{1,63}$/i.test(t) ? t : "";
  return {
    ok: !!w || !!safeName,
    label: safeName || (w ? w.slice(0, 4) + ".." + w.slice(-4) : ""),
    isFounder: false,
  };
}

function chat(q: string, u: ReturnType<typeof getUser>) {
  const raw = q.trim();
  const s = raw.toLowerCase();

  if (!u.ok) {
    return "🔒 TEOS Sovereign Chat is for wallet-connected owners. Connect the Phantom wallet holding your .teos asset, then ask about TEOS at web4.elmahrosa.org.";
  }

  const hi = u.isFounder
    ? "Welcome, Ayman — TEOS Founder"
    : u.label
      ? `Welcome ${u.label}`
      : "Welcome";

  if (!raw || raw.length <= 3) {
    return `${hi}. Ask me about a TEOS domain, pricing, or the sovereign system.`;
  }

  if (/price|pricing|cost|سعر|اسعار|بكام|تكلفة/.test(s)) {
    const rows = PRICE_TIERS.map((t) => `- ${t.id.toUpperCase()} (${t.tlds === null ? "all other TLDs" : t.tlds.map((x) => "." + x).join(" ")}): ` + t.prices.map((p, i) => `${LENGTH_LABELS[i]} $${p}`).join(", ")).join("\n");
    return `${hi}. TEOS prices by name length and region. 

${rows}

Payment is in SOL on Solana. Quotes are locked for 5 minutes. Any non-.teos name requires the same name under .teos first.`;
  }

  if (/payment|pay|دفع|الدفع|solana|sol/.test(s)) {
    return `${hi}. The supported payment method for online domain registration is SOL on Solana through the connected wallet.`;
  }

  if (/domain only|just a domain|setup|trade|design|بيع|تداول|دومين بس/.test(s)) {
    return `${hi}. You can own a name.teos domain in your Solana wallet as a Metaplex Core asset. You can hold or trade the asset. The wider sovereign browser and gateway are separate parts of the TEOS ecosystem.`;
  }

  if (/system|browser|gateway|منظومة|متصفح/.test(s)) {
    return `${hi}. The TEOS Sovereign Root is the starting identity. A .teos root name is required before unlocking the corresponding country identities, subject to the ecosystem rules.`;
  }

  if (/freename|ens|unstopp|compare|مقارنة/.test(s)) {
    return `${hi}. TEOS uses a sovereign-root model: the .teos identity is the root, and country identities require the matching root name. TEOS names are issued as Metaplex Core assets on Solana.`;
  }

  if (/after|next|بعد|ماذا بعد/.test(s)) {
    return `${hi}. After acquiring a .teos root name, you can check eligibility for the corresponding country identities. Each asset is held in your wallet.`;
  }

  return `${hi}. I can help with:
1. Domain availability and the current price tiers.
2. SOL payment and the five-minute quote.
3. The .teos sovereign root and country-name requirements.

What would you like to know?`;
}

export async function POST(req: Request) {
  const rl = await checkRateLimit("chat", 30, 60);
  if (!rl.allowed) return rateLimitResponse(rl.resetInSec);
  try {
    const b = await req.json();
    let raw = b.message || b.text || b.prompt || "";
    if (b.messages?.length) {
      raw = b.messages[b.messages.length - 1]?.content || raw;
    }
    raw = typeof raw === "string" ? raw.slice(0, 500) : "";
    const u = getUser(b);
    const r = chat(raw, u);
    return NextResponse.json({ reply: r, text: r });
  } catch {
    return NextResponse.json({
      reply: "🔒 Connect your wallet to use the TEOS sovereign chat.",
    });
  }
}

