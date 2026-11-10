// Client-side countdown helper for the mint modal.
// The server quote TTL is QUOTE_TTL_SECONDS (default 300, see lib/quoteStore.ts). The displayed countdown ends
// REFRESH_MARGIN_MS before the server expiry, so the modal fetches a fresh quote before the old one can expire
// and "expired" never flashes at the 5-minute mark. A minimum of 1 s avoids a tight refresh loop.
export const LOCK_MS = 300_000;
export const REFRESH_MARGIN_MS = 5_000;

export function lockEndFor(now: number, expiresAt: number, lockMs: number = LOCK_MS): number {
  return Math.max(now + 1000, Math.min(now + lockMs, expiresAt - REFRESH_MARGIN_MS));
}

export function secondsLeft(now: number, lockEnd: number): number {
  return Math.max(0, Math.ceil((lockEnd - now) / 1000));
}
