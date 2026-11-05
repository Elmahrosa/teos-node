import { NextResponse } from "next/server";

function getUser(b: any) {
  const w = b.wallet || b.walletAddress || "";
  const t = b.teosName || b.name || "";
  return {
    ok: !!w || !!t,
    label: t || (w ? w.slice(0, 4) + ".." + w.slice(-4) : ""),
    isFounder: t.toLowerCase().includes("ayman"),
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
    return `${hi}. Current TEOS one-time mint prices:

- 1 character: $2,000
- 2–3 characters: $400
- 4 characters: $150
- 5+ characters: $30

Prices are per name, not per TLD. Payment is in SOL on Solana. Quotes are locked for 5 minutes. There is no founder discount or $10 offer.`;
  }

  if (/payment|pay|دفع|الدفع|solana|sol/.test(s)) {
    return `${hi}. The supported payment method for online domain registration is SOL on Solana through the connected wallet. Manual Vodafone Cash and PayPal payments are not offered through the website.`;
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
  try {
    const b = await req.json();
    let raw = b.message || b.text || b.prompt || "";
    if (b.messages?.length) {
      raw = b.messages[b.messages.length - 1]?.content || raw;
    }
    const u = getUser(b);
    const r = chat(raw, u);
    return NextResponse.json({ reply: r, text: r });
  } catch {
    return NextResponse.json({
      reply: "🔒 Connect your wallet to use the TEOS sovereign chat.",
    });
  }
}
