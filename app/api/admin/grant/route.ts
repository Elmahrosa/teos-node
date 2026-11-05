import { NextResponse } from "next/server";
import bs58 from "bs58";
import { verifySession } from "../../../../lib/founderAuth";
import { claimDomain, isClaimed, incrSold, recordMint, logPendingMint } from "../../../../lib/registry";
import { isSealedDomain } from "../../../../lib/sealed";
import { isNotForSaleDomain } from "../../../../lib/domain-rules";
import { mintTeosAsset } from "../../../../lib/mint";

export const dynamic = "force-dynamic";

const RESERVED = ["ayman", "elmahrosa", "teos", "admin", "api", "www", "mail", "root", "support", "web4"];

function validWallet(w: string): boolean {
  try { return bs58.decode(w).length === 32; } catch { return false; }
}

// Records a hand sale (Vodafone Cash / PayPal): claims the name in the registry, then mints it to the buyer's wallet.
export async function POST(req: Request) {
  if (!verifySession(req.headers.get("cookie"))) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const rawName = String(body.name || "").toLowerCase().trim();
  if (isNotForSaleDomain(rawName)) return NextResponse.json({ ok: false, error: "name is reserved" }, { status: 400 });
  const name = rawName.replace(/\.teos$/, "").replace(/[^a-z0-9-]/g, "");
  const wallet = String(body.wallet || "").trim();
  const ref = String(body.ref || "manual").slice(0, 100);
  if (!name || !wallet) return NextResponse.json({ ok: false, error: "name and wallet required" }, { status: 400 });
  if (name.length < 3 || name.length > 30) return NextResponse.json({ ok: false, error: "invalid_name_length" }, { status: 400 });
  if (!validWallet(wallet)) return NextResponse.json({ ok: false, error: "invalid_wallet" }, { status: 400 });
  if (RESERVED.includes(name)) return NextResponse.json({ ok: false, error: "name is reserved" }, { status: 400 });
  if (isSealedDomain(name) || (await isClaimed(name))) return NextResponse.json({ ok: false, error: "unavailable" }, { status: 409 });
  if (!(await claimDomain(name, wallet, `manual:${ref}`))) return NextResponse.json({ ok: false, error: "unavailable" }, { status: 409 });
  await incrSold("teos").catch(() => {});

  let mint: { asset: string; signature: string } | null = null;
  try {
    mint = await mintTeosAsset(name, wallet);
    if (mint) await recordMint(name, mint);
  } catch (e: any) {
    console.error("[grant] mint_failed", JSON.stringify({ name, wallet, ref, error: String(e?.message ?? e).slice(0, 300) }));
  }
  if (!mint) await logPendingMint(name, "teos", wallet, `manual:${ref}`).catch(() => {});
  return NextResponse.json({ ok: true, name, wallet, result: mint ? "minted" : "recorded_pending_mint", asset: mint?.asset ?? null, pending_mint: !mint });
}
