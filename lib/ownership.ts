import { env } from "./env";
import { mintAuthorityPublicKey } from "./mint";
import { getMintAsset } from "./registry";

// No collection exists, so ownership never depends on one. A wallet owns <name>.teos when it holds an asset
// named "<name>.teos" AND the asset is ours: either its id is the mint recorded in our registry for that name,
// or its update authority is one of our authorities (the mint key, plus TEOS_UPDATE_AUTHORITY, comma separated).
// A look-alike asset with the same name from anyone else matches neither and is rejected.

export type DasAsset = { id?: string; content?: { metadata?: { name?: string } }; authorities?: { address?: string }[] };

function rpcUrl(): string | null {
  const explicit = env("MINT_RPC_URL") || env("HELIUS_RPC_URL");
  const key = env("HELIUS_API_KEY");
  return explicit || (key ? `https://mainnet.helius-rpc.com/?api-key=${key}` : null);
}

export function trustedAuthorities(): Set<string> {
  const out = new Set<string>();
  const mk = mintAuthorityPublicKey();
  if (mk) out.add(mk);
  for (const a of (env("TEOS_UPDATE_AUTHORITY") ?? "").split(",").map((s) => s.trim()).filter(Boolean)) out.add(a);
  return out;
}

// Assets held by the wallet, or null when the RPC cannot answer (callers fail closed).
export async function assetsOf(wallet: string): Promise<DasAsset[] | null> {
  const url = rpcUrl();
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
    return json?.result ? (json.result.items ?? []) : null;
  } catch {
    return null;
  }
}

const assetName = (a: DasAsset) => String(a?.content?.metadata?.name ?? "").toLowerCase();

async function isOurs(a: DasAsset, name: string, trusted: Set<string>): Promise<boolean> {
  if ((a.authorities ?? []).some((x) => x?.address && trusted.has(x.address))) return true;
  const recorded = await getMintAsset(name).catch(() => null);
  return !!recorded && a.id === recorded;
}

// Names (without suffix) the wallet owns, from the assets it holds. Pure on its inputs plus the registry.
export async function ourTeosNames(items: DasAsset[]): Promise<string[]> {
  const trusted = trustedAuthorities();
  const names: string[] = [];
  for (const a of items) {
    const n = assetName(a);
    if (!n.endsWith(".teos")) continue;
    const bare = n.slice(0, -5);
    if (bare && !names.includes(bare) && (await isOurs(a, bare, trusted))) names.push(bare);
  }
  return names;
}

export async function ownsTeosOnChain(wallet: string, domain: string): Promise<boolean | null> {
  const items = await assetsOf(wallet);
  if (items === null) return null;
  const want = domain.toLowerCase();
  return (await ourTeosNames(items.filter((a) => assetName(a) === `${want}.teos`))).includes(want);
}
