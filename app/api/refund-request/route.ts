import { NextResponse } from "next/server";
import { store } from "../../../lib/teos";
export async function POST(req: Request) {
  const { signature, quote_id, wallet, reason } = await req.json().catch(() => ({}));
  if (!signature || !wallet) return NextResponse.json({ error: "missing_signature_or_wallet" }, { status: 400 });
  await store.log({ event: "refund_requested", signature, quote_id, wallet, reason, policy: "auto-refund within 24h minus network fee" });
  return NextResponse.json({ status: "refund_queued", eta: "24h" }, { status: 202 });
}
