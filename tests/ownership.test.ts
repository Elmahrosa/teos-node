import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { ourTeosNames, ownedNames, ownsTeosOnChain, trustedAuthorities, type DasAsset } from "../lib/ownership";
import { recordMint } from "../lib/registry";
import { EMPTY_SITE, defaultSiteTemplate, isEmptyImportedSite } from "../lib/sites";

test("ownership without a collection: authority or registry mint, look-alikes rejected", async () => {
  process.env.TEOS_UPDATE_AUTHORITY = "AUTH1";
  await recordMint("zed", { asset: "ASSET_Z", signature: "s" });
  const items = [
    { id: "A1", content: { metadata: { name: "1.TEOS" } }, authorities: [{ address: "AUTH1" }] },
    { id: "ASSET_Z", content: { metadata: { name: "zed.teos" } }, authorities: [{ address: "other" }] },
    { id: "FAKE", content: { metadata: { name: "ahmed.teos" } }, authorities: [{ address: "attacker" }] },
    { id: "FAKE2", content: { metadata: { name: "zed.teos" } }, authorities: [{ address: "attacker" }] },
    { id: "X", content: { metadata: { name: "foo.sol" } }, authorities: [{ address: "AUTH1" }] },
  ];
  assert.deepEqual((await ourTeosNames(items)).sort(), ["1", "zed"]);
});

test("compromised authority (matched by SHA-256) fails closed instead of being trusted", async () => {
  // Use a FAKE key; never put the real compromised key in the repo.
  const fake = "11111111111111111111111111111111";
  const prevAuth = process.env.TEOS_UPDATE_AUTHORITY;
  const prevHash = process.env.COMPROMISED_AUTHORITY_HASH;
  process.env.TEOS_UPDATE_AUTHORITY = fake;
  process.env.COMPROMISED_AUTHORITY_HASH = createHash("sha256").update(fake, "utf8").digest("hex");
  try {
    await assert.rejects(trustedAuthorities(), /compromised authority/);
  } finally {
    if (prevAuth === undefined) delete process.env.TEOS_UPDATE_AUTHORITY;
    else process.env.TEOS_UPDATE_AUTHORITY = prevAuth;
    if (prevHash === undefined) delete process.env.COMPROMISED_AUTHORITY_HASH;
    else process.env.COMPROMISED_AUTHORITY_HASH = prevHash;
  }
});

// ---- Owner wallet fixtures (public data only; no secrets) -----------------------------------------
// The three update authorities now configured in production as TEOS_UPDATE_AUTHORITY.
const TEOS_AUTH = "Gh6rfsstqidzQytndXDhzWZWTqcwsUvm3UL1P45sRtWB";
const CNFT_AUTH_A = "7BKuCwxE4CGPBHDxG2irP9id1Su9W5t8PaSZF9RqLF1S";
const CNFT_AUTH_B = "2JtyfKNr8hc2h3LfiUGRiptfnQ46ij69uELrvzqLPsN4";
const THREE_TEOS_AUTHORITIES = `${TEOS_AUTH},${CNFT_AUTH_A},${CNFT_AUTH_B}`;
const OWNER_WALLET = "5qMYGVpKrKfS7myEYxt7t5QLs48BYeZq9B4nF3q6gjcT";

const TEOS_FIXTURES: DasAsset[] = [
  { id: "FIX_TEOS_AYMAN", content: { metadata: { name: "AYMAN.TEOS" } }, authorities: [{ address: OWNER_WALLET }] },
  { id: "FIX_TEOS_ELMAHROSA", content: { metadata: { name: "ELMAHROSA.TEOS" } }, authorities: [{ address: OWNER_WALLET }] },
  { id: "FIX_TEOS_1", content: { metadata: { name: "1.TEOS" } }, authorities: [{ address: OWNER_WALLET }] },
];

const CNFT_FIXTURES: DasAsset[] = [
  { id: "FIX_KW", content: { metadata: { name: "AYMAN.KW" } }, authorities: [{ address: CNFT_AUTH_A }] },
  { id: "FIX_QA", content: { metadata: { name: "AYMAN.QA" } }, authorities: [{ address: CNFT_AUTH_A }] },
  { id: "FIX_BH", content: { metadata: { name: "AYMAN.BH" } }, authorities: [{ address: CNFT_AUTH_A }] },
  { id: "FIX_SA", content: { metadata: { name: "ELMAHROSA.SA" } }, authorities: [{ address: CNFT_AUTH_A }] },
  { id: "FIX_AE", content: { metadata: { name: "ELMAHROSA.AE" } }, authorities: [{ address: CNFT_AUTH_A }] },
  { id: "FIX_OM", content: { metadata: { name: "ELMAHROSA.OM" } }, authorities: [{ address: CNFT_AUTH_A }] },
  { id: "FIX_AHLY", content: { metadata: { name: "AHLY.EG" } }, authorities: [{ address: CNFT_AUTH_B }] },
  { id: "FIX_FACEBOOK", content: { metadata: { name: "FACEBOOK.EG" } }, authorities: [{ address: CNFT_AUTH_B }] },
];

async function withEnv<T>(vars: Record<string, string | undefined>, fn: () => Promise<T>): Promise<T> {
  const prev: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(vars)) {
    prev[k] = process.env[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  try {
    return await fn();
  } finally {
    for (const [k, v] of Object.entries(prev)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

// No RPC at all: ownership is decided by the authority allowlist / registry, and unproven names stay
// listed but unverified. This mirrors a production env where provenance is unavailable.
const NO_RPC_ENV = {
  MINT_RPC_URL: undefined,
  HELIUS_RPC_URL: undefined,
  HELIUS_API_KEY: undefined,
  MINT_AUTHORITY_KEYPAIR: "",
  COMPROMISED_AUTHORITY_HASH: undefined,
  TEOS_UPDATE_AUTHORITY: THREE_TEOS_AUTHORITIES,
};

function rpcResponse(result: unknown): Response {
  return new Response(JSON.stringify({ jsonrpc: "2.0", id: "test", result }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

// Stubs the three RPC calls used by provenance. `keys` is the accountKeys array of the creation tx.
async function withMockProvenance<T>(
  asset: DasAsset,
  keys: unknown[],
  fn: () => Promise<T>,
  signatures: unknown = [{ signature: "SIG_CREATION" }]
): Promise<T> {
  const prevFetch = globalThis.fetch;
  globalThis.fetch = (async (_input: any, init?: any) => {
    const body = JSON.parse(String(init?.body ?? "{}"));
    if (body.method === "getAssetsByOwner") return rpcResponse({ items: [asset] });
    if (body.method === "getSignaturesForAddress") return rpcResponse(signatures);
    if (body.method === "getTransaction") {
      return rpcResponse({
        transaction: {
          message: {
            accountKeys: keys,
            header: { numRequiredSignatures: keys.filter((k: any) => typeof k === "string" || k?.signer === true).length },
          },
        },
      });
    }
    return rpcResponse(null);
  }) as typeof fetch;
  try {
    return await fn();
  } finally {
    globalThis.fetch = prevFetch;
  }
}

test("TEOS_UPDATE_AUTHORITY parses all three confirmed TEOS keys", async () => {
  await withEnv(NO_RPC_ENV, async () => {
    const trusted = await trustedAuthorities();
    assert.equal(trusted.size, 3);
    for (const key of [TEOS_AUTH, CNFT_AUTH_A, CNFT_AUTH_B]) assert.ok(trusted.has(key), key);
  });
});

test("namespace coverage: all 11 owned names are listed, including names with no site or registry", async () => {
  await withEnv(NO_RPC_ENV, async () => {
    await recordMint("1", { asset: "FIX_TEOS_1", signature: "s" });
    const owned = await ownedNames([...TEOS_FIXTURES, ...CNFT_FIXTURES]);
    assert.deepEqual(
      owned.map((n) => n.name).sort(),
      [
        "1.teos",
        "ahly.eg",
        "ayman.bh",
        "ayman.kw",
        "ayman.qa",
        "ayman.teos",
        "elmahrosa.ae",
        "elmahrosa.om",
        "elmahrosa.sa",
        "elmahrosa.teos",
        "facebook.eg",
      ]
    );
    assert.equal(owned.length, 11);
    // 8 cNFTs via the authority allowlist + 1.teos via the registry record.
    assert.equal(owned.filter((n) => n.verified).length, 9);
    const byName = new Map(owned.map((n) => [n.name, n]));
    assert.equal(byName.get("ayman.teos")?.verified, false);
    assert.equal(byName.get("elmahrosa.teos")?.verified, false);
    assert.equal(byName.get("1.teos")?.verified, true);
    for (const n of CNFT_FIXTURES) {
      assert.equal(byName.get(String(n.content?.metadata?.name).toLowerCase())?.verified, true);
    }
  });
});

test("all eight cNFT names verify through the comma-separated authority allowlist", async () => {
  await withEnv(NO_RPC_ENV, async () => {
    const owned = await ownedNames(CNFT_FIXTURES);
    assert.equal(owned.length, 8);
    assert.ok(owned.every((n) => n.verified), JSON.stringify(owned));
  });
});

test("names are normalised (case, whitespace, trailing dots) and deduplicated by full name", async () => {
  await withEnv(NO_RPC_ENV, async () => {
    const owned = await ownedNames([
      { id: "N1", content: { metadata: { name: " AYMAN.TEOS. " } }, authorities: [{ address: OWNER_WALLET }] },
      { id: "N1_DUP", content: { metadata: { name: "ayman.teos" } }, authorities: [{ address: OWNER_WALLET }] },
      { id: "N2", content: { metadata: { name: "ELMAHROSA.KW  " } }, authorities: [{ address: CNFT_AUTH_A }] },
      { id: "N3", content: { metadata: { name: "not-a-known-namespace.xyz" } }, authorities: [{ address: CNFT_AUTH_A }] },
      { id: "N4", content: { metadata: { name: "no-tld" } }, authorities: [{ address: CNFT_AUTH_A }] },
    ]);
    assert.deepEqual(owned.map((n) => n.name), ["ayman.teos", "elmahrosa.kw"]);
    assert.equal(owned[0].label, "ayman");
    assert.equal(owned[0].tld, "teos");
    assert.equal(owned[0].verified, false);
    assert.equal(owned[1].verified, true);
  });
});

test("anti-spoof: a look-alike ayman.teos from an unknown minter is not owned", async () => {
  await withEnv({ ...NO_RPC_ENV, MINT_RPC_URL: "https://rpc.test.invalid" }, async () => {
    const spoof: DasAsset = { id: "SPOOF_AYMAN_1", content: { metadata: { name: "ayman.teos" } }, authorities: [{ address: OWNER_WALLET }] };
    const owned = await withMockProvenance(spoof, [{ pubkey: "ATTACKER_MINTER", signer: true }], () => ownsTeosOnChain(OWNER_WALLET, "ayman"));
    assert.equal(owned, false);
  });
});

test("provenance: accepted only when a trusted authority actually signed the creation transaction", async () => {
  await withEnv({ ...NO_RPC_ENV, MINT_RPC_URL: "https://rpc.test.invalid" }, async () => {
    const held = (id: string): DasAsset => ({ id, content: { metadata: { name: "ayman.teos" } }, authorities: [{ address: OWNER_WALLET }] });

    // Trusted key signs -> verified.
    assert.equal(
      await withMockProvenance(held("PROV_SIGNED"), [{ pubkey: TEOS_AUTH, signer: true }, { pubkey: "OTHER", signer: false }], () =>
        ownsTeosOnChain(OWNER_WALLET, "ayman")
      ),
      true
    );

    // Trusted key is in the transaction but did not sign -> not verified.
    assert.equal(
      await withMockProvenance(held("PROV_NOT_SIGNER"), [{ pubkey: TEOS_AUTH, signer: false }, { pubkey: "OTHER", signer: true }], () =>
        ownsTeosOnChain(OWNER_WALLET, "ayman")
      ),
      false
    );

    // json encoding: only the first numRequiredSignatures keys are signers.
    assert.equal(
      await withMockProvenance(held("PROV_JSON_HEADER"), [TEOS_AUTH, "OTHER"], () => ownsTeosOnChain(OWNER_WALLET, "ayman")),
      true
    );
  });
});

test("provenance RPC failure fails closed (null, never 'owned' or 'not owner')", async () => {
  await withEnv({ ...NO_RPC_ENV, MINT_RPC_URL: "https://rpc.test.invalid" }, async () => {
    const held: DasAsset = { id: "PROV_RPC_DOWN", content: { metadata: { name: "ayman.teos" } }, authorities: [{ address: OWNER_WALLET }] };
    const prevFetch = globalThis.fetch;
    globalThis.fetch = (async (_input: any, init?: any) => {
      const body = JSON.parse(String(init?.body ?? "{}"));
      if (body.method === "getAssetsByOwner") return rpcResponse({ items: [held] });
      return new Response("rpc down", { status: 500 });
    }) as typeof fetch;
    try {
      assert.equal(await ownsTeosOnChain(OWNER_WALLET, "ayman"), null);
    } finally {
      globalThis.fetch = prevFetch;
    }
  });
});

test("import fallback: empty config detection and default template", () => {
  assert.equal(isEmptyImportedSite(null), true);
  assert.equal(isEmptyImportedSite({ ...EMPTY_SITE }), true);
  assert.equal(isEmptyImportedSite({ ...EMPTY_SITE, title: "ayman.elmahrosa.org" }, "ayman.elmahrosa.org"), true);
  assert.equal(isEmptyImportedSite({ ...EMPTY_SITE, title: "Real title" }), false);
  assert.equal(isEmptyImportedSite({ ...EMPTY_SITE, tagline: "We build things." }), false);
  assert.equal(isEmptyImportedSite({ ...EMPTY_SITE, sections: [{ heading: "About", body: "Readable text" }] }), false);
  assert.equal(isEmptyImportedSite({ ...EMPTY_SITE, links: [{ label: "Contact", url: "https://example.com" }] }), false);

  const tpl = defaultSiteTemplate("Ayman");
  assert.equal(tpl.title, "ayman.teos");
  assert.ok(tpl.tagline.length > 0);
  assert.equal(tpl.sections.length, 1);
  assert.ok(tpl.sections[0].body.length > 0);
  assert.deepEqual(tpl.links, [{ label: "ayman.teos", url: "https://ayman.teos" }]);
});
