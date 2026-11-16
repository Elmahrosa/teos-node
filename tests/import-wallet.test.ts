import test from "node:test";
import assert from "node:assert/strict";

const { normalizeImportUrl, ImportError } = await import("../lib/site-import");
const { importMessage, sanitizeSite, siteMessage } = await import("../lib/sites");
const { inspectTransfer } = await import("../lib/wallet-send");
const { Keypair, PublicKey, SystemProgram, Transaction } = await import("@solana/web3.js");

const code = (raw: string) => {
  try {
    normalizeImportUrl(raw);
    return "ok";
  } catch (err) {
    return err instanceof ImportError ? err.code : "unexpected";
  }
};

test("import URL: only public https origins are accepted", () => {
  assert.equal(code("https://example.com/about"), "ok");
  assert.equal(code("https://example.com:443/about"), "ok");

  assert.equal(code("http://example.com"), "https_required");
  assert.equal(code("ftp://example.com"), "https_required");
  assert.equal(code(""), "bad_url");
  assert.equal(code("not a url"), "bad_url");
  assert.equal(code(`https://example.com/${"a".repeat(500)}`), "bad_url");
  assert.equal(code("https://user:pass@example.com"), "bad_url");
  assert.equal(code("https://example.com:8443"), "bad_url");
});

test("import URL: local, private and obfuscated addresses are refused", () => {
  assert.equal(code("https://localhost"), "private_host");
  assert.equal(code("https://app.localhost"), "private_host");
  assert.equal(code("https://printer.local"), "private_host");
  assert.equal(code("https://127.0.0.1"), "private_host");
  assert.equal(code("https://10.1.2.3"), "private_host");
  assert.equal(code("https://172.20.0.1"), "private_host");
  assert.equal(code("https://192.168.1.1"), "private_host");
  assert.equal(code("https://169.254.169.254/latest/meta-data"), "private_host");
  assert.equal(code("https://[::1]"), "private_host");
  // WHATWG URL normalises these IPv4 spellings to 127.0.0.1 before the check.
  assert.equal(code("https://2130706433"), "private_host");
  assert.equal(code("https://0x7f.1"), "private_host");
});

test("import and publish signatures are domain-separated", () => {
  assert.equal(importMessage("ayman", 1, "abc"), "teos://import/ayman/1/abc");
  assert.equal(siteMessage("ayman", 1, "abc"), "teos://site/ayman/1/abc");
  assert.notEqual(importMessage("ayman", 1, "abc"), siteMessage("ayman", 1, "abc"));
});

test("imported content is sanitised: no javascript URLs, no http images", () => {
  const site = sanitizeSite({
    title: "  Company  ",
    tagline: "We build things.",
    theme: "gold",
    image: "http://example.com/a.png",
    sections: [{ heading: "About", body: "Hello" }],
    links: [
      { label: "Bad", url: "javascript:alert(1)" },
      { label: "Good", url: "https://example.com/contact" },
    ],
  });
  assert.equal(site.title, "Company");
  assert.equal(site.image, "");
  assert.deepEqual(site.links, [{ label: "Good", url: "https://example.com/contact" }]);
});

const b64tx = (raw: Uint8Array) => Buffer.from(raw).toString("base64");
const fakeBlockhash = SystemProgram.programId.toBase58();

function transferTx(from: InstanceType<typeof Keypair>, lamports = 1000) {
  const tx = new Transaction().add(SystemProgram.transfer({ fromPubkey: from.publicKey, toPubkey: Keypair.generate().publicKey, lamports }));
  tx.feePayer = from.publicKey;
  tx.recentBlockhash = fakeBlockhash;
  return tx;
}

test("wallet send: accepts one signed System transfer by the fee payer", () => {
  const from = Keypair.generate();
  const tx = transferTx(from, 12_345);
  tx.sign(from);
  const check = inspectTransfer(b64tx(tx.serialize()), from.publicKey.toBase58());
  assert.deepEqual(check, { ok: true, lamports: 12_345 });
});

test("wallet send: rejects a fee payer mismatch and unsigned transfers", () => {
  const from = Keypair.generate();
  const other = Keypair.generate();
  const tx = transferTx(from);
  tx.sign(from);
  assert.equal(inspectTransfer(b64tx(tx.serialize()), other.publicKey.toBase58()).ok, false);
  assert.deepEqual(inspectTransfer(b64tx(tx.serialize()), other.publicKey.toBase58()), { ok: false, error: "wallet_mismatch" });

  const unsigned = transferTx(Keypair.generate());
  assert.deepEqual(inspectTransfer(b64tx(unsigned.serialize({ requireAllSignatures: false })), unsigned.feePayer!.toBase58()), {
    ok: false,
    error: "unsigned_transaction",
  });
});

test("wallet send: rejects tampered signatures and extra instructions", () => {
  const from = Keypair.generate();
  const tx = transferTx(from);
  tx.sign(from);
  const raw = tx.serialize();
  raw[10] ^= 0xff; // inside the 64-byte signature
  assert.deepEqual(inspectTransfer(b64tx(raw), from.publicKey.toBase58()), { ok: false, error: "invalid_signature" });

  const two = new Transaction();
  two.add(SystemProgram.transfer({ fromPubkey: from.publicKey, toPubkey: Keypair.generate().publicKey, lamports: 1 }));
  two.add(SystemProgram.transfer({ fromPubkey: from.publicKey, toPubkey: Keypair.generate().publicKey, lamports: 1 }));
  two.feePayer = from.publicKey;
  two.recentBlockhash = fakeBlockhash;
  two.sign(from);
  assert.deepEqual(inspectTransfer(b64tx(two.serialize()), from.publicKey.toBase58()), { ok: false, error: "tx_not_allowed" });

  const malformed = Buffer.from("not a transaction").toString("base64");
  assert.deepEqual(inspectTransfer(malformed, from.publicKey.toBase58()), { ok: false, error: "bad_transaction" });
});
