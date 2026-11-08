// TODO DELETE BEFORE MERGE - Preview-only diagnostics for the client IP header shape.
// Disabled unless IP_DEBUG=1 is set on the Preview environment.
// Note: App Router treats folders starting with "_" as private (not routable),
// so this lives at /api/debug/ip rather than /api/_debug/ip.
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.IP_DEBUG !== "1") {
    return new Response("not found", { status: 404 });
  }
  const h = await headers();
  return Response.json(
    {
      xff: h.get("x-forwarded-for"),
      xri: h.get("x-real-ip"),
      cf: h.get("cf-connecting-ip"),
    },
    { headers: { "cache-control": "no-store" } }
  );
}
