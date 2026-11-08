import { NextResponse } from "next/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { sameOrigin } from "../../../../lib/origin";
import { verifyWalletSignature } from "../../../../lib/sig";
import { isClaimed, adminClaimDomain, recordMint, incrSold, logPendingMint, useNonce } from "../../../../lib/registry";
import { mintConfigured, mintFunds, mintTeosAsset } from "../../../../lib/mint";
import { parseDomain } from "../../../../lib/domain-rules";
import { buildClaimMessage, founderWallet, isPublicKey, nonceOk } from "../../../../lib/founderClaim";
import { fullName, isSaleTld } from "../../../../lib/tlds";

// POST /api/founder/claim - signed, server-verified free claim for the Founder wallet.
// Bypasses payment and the REGISTRATION_OPEN gate, but NOT auth: the signer must be
// exactly env("FOUNDER_WALLET") and must sign this name + owner + nonce.
export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "no-store" };

export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403, headers: noStore });

  const rl = await checkRateLimit("founder-claim", 10, 60);
  if (!rl.allowed) return rateLimitResponse(rl.resetInSec);

  const owner = founderWallet();
  if (!owner) return NextResponse.json({ error: "founder_wallet_not_configured" }, { status: 503, headers: noStore });
  if (!mintConfigured()) return NextResponse.json({ error: "mint_not_configured" }, { status: 503, headers: noStore });

  const body = await req.json().catch(() => ({}));
  const { domain, signature, publicKey, nonce } = body ?? {};

  if (!isPublicKey(publicKey) || !nonceOk(nonce) || typeof signature !== "string" || !signature) {
    return NextResponse.json({ error: "missing_signature_or_nonce" }, { status: 400, headers: noStore });
  }

  // Auth: only the Founder wallet. The owner is never taken from the request body.
  if (publicKey !== owner) {
    return NextResponse.json({ error: "not_founder" }, { status: 403, headers: noStore });
  }

  const parsed = parseDomain(domain);
  if (!parsed.ok) return NextResponse.json(parsed.body, { status: parsed.status, headers: noStore });

  const message = buildClaimMessage("claim", [parsed.domain], owner, nonce);
  if (!(await verifyWalletSignature(message, signature, publicKey))) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401, headers: noStore });
  }

  // One-time nonce: a captured signature cannot be replayed.
  if (!(await useNonce(nonce))) {
    return NextResponse.json({ error: "nonce_used" }, { status: 409, headers: noStore });
  }

  const tld = "teos";
  if (!isSaleTld(tld)) return NextResponse.json({ error: "tld_blocked" }, { status: 503, headers: noStore });

  const name = fullName(parsed.domain, tld);
  if (await isClaimed(name)) {
    return NextResponse.json({ error: "already_minted", domain: name }, { status: 409, headers: noStore });
  }

  const funds = await mintFunds(1);
  if (!funds.ok) {
    return NextResponse.json({ error: "mint_unavailable", needed: funds.needed }, { status: 503, headers: noStore });
  }

  // Founder claims may take sealed family names (e.g. ashraf), but never ayman.
  const tx = `founder-claim:${nonce}`;
  if (!(await adminClaimDomain(name, owner, tx))) {
    return NextResponse.json({ error: "already_minted", domain: name }, { status: 409, headers: noStore });
  }

  try {
    const mint = await mintTeosAsset(parsed.domain, owner, tld);
    if (!mint) {
      await logPendingMint(parsed.domain, tld, owner, tx).catch(() => {});
      return NextResponse.json({ ok: true, domain: name, owner, pending_mint: true }, { headers: noStore });
    }
    await recordMint(name, mint);
    await incrSold(tld).catch(() => {});
    return NextResponse.json(
      { ok: true, domain: name, owner, asset: mint.asset, mint_tx: mint.signature, pending_mint: false },
      { headers: noStore }
    );
  } catch {
    // The claim stays; the mint is queued for the retry process.
    await logPendingMint(parsed.domain, tld, owner, tx).catch(() => {});
    return NextResponse.json({ ok: true, domain: name, owner, pending_mint: true }, { headers: noStore });
  }
}
