// Runs once when the Next.js server starts. Starts the 5-minute retry worker for paid-but-unminted names.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { startPendingMintWorker } = await import("./lib/pendingMints");
  startPendingMintWorker();
}
