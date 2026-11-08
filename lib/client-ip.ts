import { headers } from "next/headers";

// Railway's edge hop count is undocumented and may change. Prefer the edge-set
// x-real-ip; otherwise take the LAST X-Forwarded-For entry (the hop appended by
// the edge). Never select by a fixed position like second-to-last: if the edge
// ever appends an extra hop, that position becomes attacker-controlled.
export function pickClientIp(xff: string | null, realIp: string | null): string {
  const real = realIp?.trim();
  if (real) return real;
  if (xff) {
    const parts = xff.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }
  return "unknown";
}

export async function getClientIp(): Promise<string> {
  const h = await headers();
  return pickClientIp(h.get("x-forwarded-for"), h.get("x-real-ip"));
}
