import { headers } from "next/headers";

// Behind the Railway edge the real client is the second-to-last X-Forwarded-For entry.
// Counting from the END means a client that prepends fake entries cannot change the result.
export function pickClientIp(xff: string | null, realIp: string | null): string {
  if (xff) {
    const parts = xff.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length >= 2) return parts[parts.length - 2];
    if (parts.length === 1) return parts[0];
  }
  return realIp?.trim() || "unknown";
}

export async function getClientIp(): Promise<string> {
  const h = await headers();
  return pickClientIp(h.get("x-forwarded-for"), h.get("x-real-ip"));
}