import { NextResponse } from "next/server";
import { clientIp, rateLimit, store } from "../../../lib/teos";
export async function POST(req: Request) {
  if (!(await rateLimit(`refund:${clientIp(req)}`, 5, 60))) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  const { signature, quote_id, wallet, reason } = await req.json().catch(() => ({}));
  if (!signature || !wallet) return NextResponse.json({ error: "missing_signature_or_wallet" }, { status: 400 });
  await store.log({ event: "refund_requested", signature, quote_id, wallet, reason, policy: "auto-refund within 24h minus network fee" });
  return NextResponse.json({ status: "refund_queued", eta: "24h" }, { status: 202 });
}
