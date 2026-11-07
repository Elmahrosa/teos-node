import { env } from "./env";

// True when `wallet` holds `domain`.teos on-chain right now (Metaplex Core asset, from COLLECTION_ADDRESS when set).
// null = could not check (no RPC or RPC failure): callers must fail closed.
export async function ownsTeosOnChain(wallet: string, domain: string): Promise<boolean | null> {
  const explicit = env("MINT_RPC_URL") || env("HELIUS_RPC_URL");
  const key = env("HELIUS_API_KEY");
  const url = explicit || (key ? `https://mainnet.helius-rpc.com/?api-key=${key}` : null);
  if (!url) return null;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: "owns-teos-check", method: "getAssetsByOwner", params: { ownerAddress: wallet, page: 1, limit: 1000 } }),
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const json: any = await res.json();
    if (!json?.result) return null;
    const items: any[] = json.result.items ?? [];
    const collection = env("COLLECTION_ADDRESS");
    const want = `${domain.toLowerCase()}.teos`;
    return items.some((a: any) => {
      if (String(a?.content?.metadata?.name ?? "").toLowerCase() !== want) return false;
      if (!collection) return true;
      return (a?.grouping ?? []).some((g: any) => g.group_key === "collection" && g.group_value === collection);
    });
  } catch {
    return null;
  }
}
