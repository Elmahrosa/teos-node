// Server-only Helius DAS helpers. The API key is passed in by the caller and never logged.

export type NftItem = {
  id: string;
  name: string;
  image: string;
  collection: string;
  compressed: boolean;
  interface: string;
};

const HELIUS_TIMEOUT_MS = 10_000;

function endpoint(key: string) {
  return `https://mainnet.helius-rpc.com/?api-key=${encodeURIComponent(key)}`;
}

export function mapAsset(a: any): NftItem {
  const meta = a?.content?.metadata ?? {};
  const image = a?.content?.links?.image || a?.content?.files?.[0]?.uri || "";
  const grouping = Array.isArray(a?.grouping) ? a.grouping : [];
  const collection = grouping.find((g: any) => g?.group_key === "collection")?.group_value ?? "";
  return {
    id: String(a?.id ?? ""),
    name: String(meta?.name ?? ""),
    image: String(image ?? ""),
    collection: String(collection ?? ""),
    compressed: Boolean(a?.compression?.compressed),
    interface: String(a?.interface ?? ""),
  };
}

async function rpc(key: string, body: unknown): Promise<any> {
  const res = await fetch(endpoint(key), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(HELIUS_TIMEOUT_MS),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`helius_http_${res.status}`);
  const json: any = await res.json();
  if (json?.error) throw new Error("helius_rpc_error");
  return json?.result;
}

export async function getAssetsByOwner(wallet: string, key: string): Promise<NftItem[]> {
  const result = await rpc(key, {
    jsonrpc: "2.0",
    id: "get-assets",
    method: "getAssetsByOwner",
    params: { ownerAddress: wallet, page: 1, limit: 1000 },
  });
  const raw = Array.isArray(result?.items) ? result.items : [];
  return raw.map(mapAsset);
}

export async function getSolBalance(wallet: string, key: string): Promise<number> {
  const result = await rpc(key, { jsonrpc: "2.0", id: "get-balance", method: "getBalance", params: [wallet] });
  const lamports = Number(result?.value);
  return Number.isFinite(lamports) ? lamports / 1e9 : 0;
}
