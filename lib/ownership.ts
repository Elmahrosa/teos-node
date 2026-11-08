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

// P0-1 guard: a known-compromised authority (see commit 90b8cc0 / PR #109)
// must never be trusted again. The plain address is intentionally NOT stored in
// the repo - only its SHA-256. Extra hashes can be supplied at runtime via
// COMPROMISED_AUTHORITY_HASH (comma separated, hex).
const COMPROMISED_AUTHORITY_SHA256 = new Set([
  "1dcfeca0efd5a5d1c426475ddef40435aa06ba1c1d2f6a2586ebb8e57d8aefe5",
]);

// Web Crypto (available in both Node 22 and the Edge runtime); avoids node:crypto,
// which breaks the edge instrumentation bundle.
async function sha256Hex(s: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

function compromisedHashes(): Set<string> {
  const out = new Set(COMPROMISED_AUTHORITY_SHA256);
  for (const h of (env("COMPROMISED_AUTHORITY_HASH") ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)) out.add(h);
  return out;
}

export async function trustedAuthorities(): Promise<Set<string>> {
  const out = new Set<string>();
  const mk = mintAuthorityPublicKey();
  if (mk) out.add(mk);
  for (const a of (env("TEOS_UPDATE_AUTHORITY") ?? "").split(",").map((s) => s.trim()).filter(Boolean)) out.add(a);
  const blocked = compromisedHashes();
  for (const authority of out) {
    const h = await sha256Hex(authority);
    if (blocked.has(h)) {
      throw new Error(
        `[security] a compromised authority is configured (sha256 ${h.slice(0, 12)}...); rotate TEOS_UPDATE_AUTHORITY / MINT_AUTHORITY_KEYPAIR before serving ownership checks`
      );
    }
  }
  return out;
}

// Called from instrumentation.ts so the server refuses to start with a leaked authority.
export async function assertTrustedAuthoritiesSafe(): Promise<void> {
  await trustedAuthorities();
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
    // A present-but-malformed result is an RPC failure, not "no assets" (fail closed -> 503).
    if (!json?.result) return null;
    return Array.isArray(json.result.items) ? json.result.items : null;
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
  const trusted = await trustedAuthorities();
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
