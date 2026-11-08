// Runs once when the Next.js server starts. Starts the 5-minute retry worker for paid-but-unminted names.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  // P0-1 guard: refuse to boot if a known-compromised authority is still configured.
  const { assertTrustedAuthoritiesSafe } = await import("./lib/ownership");
  await assertTrustedAuthoritiesSafe();
  const { startPendingMintWorker } = await import("./lib/pendingMints");
  startPendingMintWorker();
}
