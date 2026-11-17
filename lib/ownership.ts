import { env } from "./env";
import { mintAuthorityPublicKey } from "./mint";
import { getMintAsset } from "./registry";
import { TLDS, fullName } from "./tlds";

// No collection exists, so ownership never depends on one. A wallet owns <name>.teos when it holds an asset
// named "<name>.teos" AND the asset is ours: either its id is the mint recorded in our registry for that name,
// or its update authority is one of our authorities (the mint key, plus TEOS_UPDATE_AUTHORITY, comma separated).
// A look-alike asset with the same name from anyone else matches neither and is rejected.
//
// Lists can cover every namespace in namespaces/all.json, but authorization (ownsTeosOnChain / publishing)
// stays .teos-only. When neither the registry nor the authority proves an asset, we fall back to provenance:
// the transaction that created it must have been signed by a trusted authority. That is what makes names
// minted by TEOS and then handed to the holder (authority = holder) recognisable without trusting the name.

export type DasAsset = { id?: string; content?: { metadata?: { name?: string } }; authorities?: { address?: string }[] };

// A name the wallet holds on-chain, normalised for display. `verified` means TEOS can prove the asset came
// from us (registry mint, trusted update authority, or trusted creation transaction). Unverified names are
// still listed - never hidden - so the owner can see what the wallet actually holds.
export type OwnedName = { name: string; label: string; tld: string; verified: boolean };

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
const KNOWN_TLDS = new Set(TLDS.map((t) => String(t.tld).toLowerCase()));

// On-chain names are compared like-for-like: lowercase, trimmed, trailing dots/spaces removed.
export function normalizeAssetName(raw: unknown): string {
  return String(raw ?? "").trim().toLowerCase().replace(/[.\s]+$/g, "");
}

// "AYMAN.TEOS." -> { name: "ayman.teos", label: "ayman", tld: "teos" }. Unknown namespaces are ignored.
export function parseOwnedName(raw: unknown): { name: string; label: string; tld: string } | null {
  const name = normalizeAssetName(raw);
  const dot = name.lastIndexOf(".");
  if (dot <= 0 || dot === name.length - 1) return null;
  const label = name.slice(0, dot);
  const tld = name.slice(dot + 1);
  if (!KNOWN_TLDS.has(tld)) return null;
  if (!/^[a-z0-9-]{1,63}$/.test(label)) return null;
  return { name, label, tld };
}

// Resolves a caller's .teos input ("ayman", "ayman.teos", " AYMAN.TEOS. ") to the exact held full name.
function wantedTeosName(raw: unknown): { name: string; label: string; tld: string } | null {
  let label = String(raw ?? "").trim().toLowerCase().replace(/[.\s]+$/g, "");
  if (label.endsWith(".teos")) label = label.slice(0, -5).replace(/[.\s]+$/g, "");
  if (!/^[a-z0-9-]{1,63}$/.test(label)) return null;
  return { name: `${label}.teos`, label, tld: "teos" };
}

async function isOurs(a: DasAsset, registryKey: string, trusted: Set<string>): Promise<boolean> {
  if ((a.authorities ?? []).some((x) => x?.address && trusted.has(x.address))) return true;
  const recorded = await getMintAsset(registryKey).catch(() => null);
  return !!recorded && a.id === recorded;
}

// ---- Creation-transaction provenance ---------------------------------------------------------
// Some TEOS names were minted and then had their update authority handed to the holder, and older mints
// predate the registry. Neither cheap check can see them, so we look at the transaction that created the
// asset: if a trusted authority signed it, the asset is ours. Fail closed: RPC failure => null (not owned
// and not rejected), never a guess.

type RpcOutcome<T> = { ok: true; value: T } | { ok: false };

const RPC_TIMEOUT_MS = 6000;
const PROVENANCE_TTL_MS = 10 * 60 * 1000;
const provenanceCache = new Map<string, { at: number; value: boolean }>();

async function rpc<T>(url: string, method: string, params: unknown): Promise<RpcOutcome<T>> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: "teos-ownership", method, params }),
      signal: AbortSignal.timeout(RPC_TIMEOUT_MS),
      cache: "no-store",
    });
    if (!res.ok) return { ok: false };
    const json: any = await res.json().catch(() => null);
    if (!json || json.error || !Object.prototype.hasOwnProperty.call(json, "result")) return { ok: false };
    return { ok: true, value: json.result as T };
  } catch {
    return { ok: false };
  }
}

// Oldest signature for the asset (the creation transaction). Paginates with `before` only while a page is
// full. `null` value means there are no signatures at all (cannot prove provenance); !ok means RPC failure.
async function oldestSignature(url: string, address: string): Promise<RpcOutcome<string | null>> {
  let before: string | undefined;
  let oldest: string | null = null;
  for (let page = 0; page < 10; page++) {
    const params = before ? [address, { limit: 1000, before }] : [address, { limit: 1000 }];
    const r = await rpc<any[]>(url, "getSignaturesForAddress", params);
    if (!r.ok) return r;
    if (!Array.isArray(r.value)) return { ok: false };
    if (r.value.length === 0) return { ok: true, value: oldest };
    const last = r.value[r.value.length - 1];
    if (!last || typeof last.signature !== "string" || !last.signature) return { ok: false };
    oldest = last.signature;
    if (r.value.length < 1000) return { ok: true, value: oldest };
    before = last.signature;
  }
  return { ok: true, value: oldest };
}

// Accepts both RPC encodings: json (accountKeys as base58 strings + header) and jsonParsed (objects with signer).
function signedByTrusted(tx: any, trusted: Set<string>): boolean {
  const message = tx?.transaction?.message ?? tx?.message;
  const keys = message?.accountKeys;
  if (!Array.isArray(keys)) return false;
  const required = Number(message?.header?.numRequiredSignatures) || 0;
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (typeof key === "string") {
      if (i < required && trusted.has(key)) return true;
    } else if (key && typeof key.pubkey === "string" && key.signer === true && trusted.has(key.pubkey)) {
      return true;
    }
  }
  return false;
}

async function creationSignedByTrusted(assetId: string | undefined, trusted: Set<string>): Promise<boolean | null> {
  const id = String(assetId ?? "").trim();
  if (!id || trusted.size === 0) return null;
  const cached = provenanceCache.get(id);
  if (cached && Date.now() - cached.at < PROVENANCE_TTL_MS) return cached.value;
  const url = rpcUrl();
  if (!url) return null;
  const sigs = await oldestSignature(url, id);
  if (!sigs.ok) return null;
  if (sigs.value === null) return false;
  const tx = await rpc<any>(url, "getTransaction", [sigs.value, { encoding: "json", maxSupportedTransactionVersion: 0 }]);
  if (!tx.ok || !tx.value) return null;
  const value = signedByTrusted(tx.value, trusted);
  provenanceCache.set(id, { at: Date.now(), value });
  return value;
}

async function verifyAsset(a: DasAsset, parsed: { name: string; label: string; tld: string }, trusted: Set<string>): Promise<boolean | null> {
  if (await isOurs(a, fullName(parsed.label, parsed.tld), trusted)) return true;
  return creationSignedByTrusted(a.id, trusted);
}

// Names (without suffix) the wallet owns, from the assets it holds. Pure on its inputs plus the registry.
// .teos-only, registry/authority verification: existing callers (/api/owns-teos, country pricing) keep
// exactly this behaviour. New listings should use ownedNames().
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

// Every name the wallet holds in any known namespace (namespaces/all.json), deduplicated by full name.
// Unverified names are included: this is a wallet listing, not an authorization decision.
export async function ownedNames(items: DasAsset[]): Promise<OwnedName[]> {
  const trusted = await trustedAuthorities();
  const results = await Promise.all(
    items.map(async (a) => {
      const parsed = parseOwnedName(a?.content?.metadata?.name);
      if (!parsed) return null;
      // A verification failure only marks this asset unverified; it never hides the name.
      const verified = await verifyAsset(a, parsed, trusted).catch(() => null);
      return { ...parsed, verified: verified === true };
    })
  );
  const byName = new Map<string, OwnedName>();
  for (const r of results) {
    if (!r) continue;
    const prev = byName.get(r.name);
    // A real asset and a look-alike can share a name; keep the verified one.
    if (!prev || (!prev.verified && r.verified)) byName.set(r.name, r);
  }
  return [...byName.values()];
}

// SOL balance in SOL, or null when the RPC cannot answer (callers show "unavailable", never zero).
export async function solBalanceOf(wallet: string): Promise<number | null> {
  const url = rpcUrl();
  if (!url) return null;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: "balance", method: "getBalance", params: [wallet] }),
      signal: AbortSignal.timeout(6000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json: any = await res.json();
    const lamports = Number(json?.result?.value);
    return Number.isFinite(lamports) && lamports >= 0 ? lamports / 1e9 : null;
  } catch {
    return null;
  }
}

// True when the wallet holds the exact normalised <domain>.teos asset and TEOS can prove it is ours.
// null means the check itself could not run (RPC/registry failure); callers answer 503, never "not owner".
export async function ownsTeosOnChain(wallet: string, domain: string): Promise<boolean | null> {
  const items = await assetsOf(wallet);
  if (items === null) return null;
  const want = wantedTeosName(domain);
  if (!want) return false;
  const candidates = items.filter((a) => normalizeAssetName(a?.content?.metadata?.name) === want.name);
  if (candidates.length === 0) return false;
  const trusted = await trustedAuthorities();
  let unknown = false;
  for (const a of candidates) {
    const verified = await verifyAsset(a, want, trusted);
    if (verified === true) return true;
    if (verified === null) unknown = true;
  }
  return unknown ? null : false;
}
