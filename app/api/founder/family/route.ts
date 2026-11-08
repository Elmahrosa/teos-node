import { NextResponse } from "next/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { sameOrigin } from "../../../../lib/origin";
import { verifyWalletSignature } from "../../../../lib/sig";
import { isClaimed, adminClaimDomain, recordMint, incrSold, logPendingMint, useNonce } from "../../../../lib/registry";
import { mintConfigured, mintFunds, mintTeosAsset } from "../../../../lib/mint";
import { isNotForSaleDomain, isReservedWord } from "../../../../lib/domain-rules";
import { isSealedDomain } from "../../../../lib/sealed";
import { buildClaimMessage, familyWallet, founderWallet, isPublicKey, newNonce, nonceOk, parseClaimNames } from "../../../../lib/founderClaim";
import { fullName } from "../../../../lib/tlds";

// POST /api/founder/family - signed family mint tool.
// The Founder wallet signs the exact name list; the destination is ALWAYS env("FAMILY_WALLET"),
// never a value from the request body. dryRun:true reports price/status without minting.
// Works while REGISTRATION_OPEN=false. Public registration stays closed.
export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "no-store" };

// GET /api/founder/family?names=a,b,c - returns the exact message the Founder wallet must sign.
// Nothing secret leaves the server: the family address is public and the nonce is single-use.
export async function GET(req: Request) {
  const rl = await checkRateLimit("founder-family-prep", 20, 60);
  if (!rl.allowed) return rateLimitResponse(rl.resetInSec);

  const owner = familyWallet();
  if (!owner) return NextResponse.json({ error: "family_wallet_not_configured" }, { status: 503, headers: noStore });

  const raw = new URL(req.url).searchParams.get("names") ?? "";
  const list = parseClaimNames(raw.split(",").map((s) => s.trim()).filter(Boolean), 20);
  if (!list) return NextResponse.json({ error: "invalid_names" }, { status: 400, headers: noStore });

  const nonce = newNonce();
  return NextResponse.json(
    { owner, nonce, message: buildClaimMessage("family", list, owner, nonce) },
    { headers: noStore }
  );
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403, headers: noStore });

  const rl = await checkRateLimit("founder-family", 5, 60);
  if (!rl.allowed) return rateLimitResponse(rl.resetInSec);

  const founder = founderWallet();
  const owner = familyWallet();
  if (!founder) return NextResponse.json({ error: "founder_wallet_not_configured" }, { status: 503, headers: noStore });
  if (!owner) return NextResponse.json({ error: "family_wallet_not_configured" }, { status: 503, headers: noStore });
  if (!mintConfigured()) return NextResponse.json({ error: "mint_not_configured" }, { status: 503, headers: noStore });

  const body = await req.json().catch(() => ({}));
  const { names, signature, publicKey, nonce, dryRun } = body ?? {};

  if (!isPublicKey(publicKey) || !nonceOk(nonce) || typeof signature !== "string" || !signature) {
    return NextResponse.json({ error: "missing_signature_or_nonce" }, { status: 400, headers: noStore });
  }
  if (publicKey !== founder) {
    return NextResponse.json({ error: "not_founder" }, { status: 403, headers: noStore });
  }

  const list = parseClaimNames(names, 20);
  if (!list) return NextResponse.json({ error: "invalid_names" }, { status: 400, headers: noStore });

  const message = buildClaimMessage("family", list, owner, nonce);
  if (!(await verifyWalletSignature(message, signature, publicKey))) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401, headers: noStore });
  }

  const isDryRun = dryRun === true;

  // A dry run never consumes the nonce, so the same approval can be inspected first.
  if (!isDryRun && !(await useNonce(nonce))) {
    return NextResponse.json({ error: "nonce_used" }, { status: 409, headers: noStore });
  }

  const plan = await Promise.all(
    list.map(async (name) => {
      const domain = fullName(name, "teos");
      const claimed = await isClaimed(domain);
      const notForSale = isNotForSaleDomain(name);
      const reserved = isReservedWord(name);
      const sealed = isSealedDomain(name);
      return {
        name,
        domain,
        price_usd: 0, // founder-signed family mint: no payment, gas only
        claimed,
        not_for_sale: notForSale,
        reserved,
        sealed,
        status: claimed ? "taken" : notForSale ? "NOT_FOR_SALE" : reserved || sealed ? "reserved" : "free",
      };
    })
  );

  if (isDryRun) {
    return NextResponse.json({ dryRun: true, owner, names: plan }, { headers: noStore });
  }

  const funds = await mintFunds(plan.length);
  if (!funds.ok) {
    return NextResponse.json({ error: "mint_unavailable", needed: funds.needed }, { status: 503, headers: noStore });
  }

  const results: Array<{
    name: string;
    domain: string;
    ok: boolean;
    asset?: string;
    mint_tx?: string;
    pending_mint?: boolean;
    error?: string;
  }> = [];

  for (const item of plan) {
    if (item.claimed) {
      results.push({ name: item.name, domain: item.domain, ok: false, error: "already_minted" });
      continue;
    }
    if (item.not_for_sale) {
      results.push({ name: item.name, domain: item.domain, ok: false, error: "NOT_FOR_SALE" });
      continue;
    }
    // The family tool may take sealed family names, but never reserved system words.
    if (item.reserved) {
      results.push({ name: item.name, domain: item.domain, ok: false, error: "reserved_word" });
      continue;
    }

    const tx = `founder-family:${nonce}:${item.name}`;
    if (!(await adminClaimDomain(item.domain, owner, tx))) {
      results.push({ name: item.name, domain: item.domain, ok: false, error: "already_minted" });
      continue;
    }

    try {
      const mint = await mintTeosAsset(item.name, owner, "teos");
      if (!mint) {
        await logPendingMint(item.name, "teos", owner, tx).catch(() => {});
        results.push({ name: item.name, domain: item.domain, ok: true, pending_mint: true });
        continue;
      }
      await recordMint(item.domain, mint);
      await incrSold("teos").catch(() => {});
      results.push({ name: item.name, domain: item.domain, ok: true, asset: mint.asset, mint_tx: mint.signature, pending_mint: false });
    } catch {
      await logPendingMint(item.name, "teos", owner, tx).catch(() => {});
      results.push({ name: item.name, domain: item.domain, ok: true, pending_mint: true });
    }
  }

  return NextResponse.json({ dryRun: false, owner, results }, { headers: noStore });
}
