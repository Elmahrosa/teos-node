const KEY = process.env.HELIUS_KEY;
const OWNER = "3jDzy3rR9VpxXhCnnRpZ2wXQxpprQDNGT2XpL6knGLzG";
let page = 1, all = [];
while (true) {
  const r = await fetch(`https://mainnet.helius-rpc.com/?api-key=${KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getAssetsByOwner",
      params: { ownerAddress: OWNER, page, limit: 1000 } })
  });
  const j = await r.json();
  const items = j.result?.items || [];
  all.push(...items);
  console.log(`page ${page}: ${items.length}`);
  if (items.length < 1000) break;
  page++;
}
const by = {};
for (const a of all.filter(a => a.compression?.compressed)) {
  const n = a.content?.metadata?.name || "?";
  (by[n] ??= []).push(a.compression.tree.slice(0, 6));
}
for (const [n, v] of Object.entries(by).sort())
  console.log(v.length > 1 ? "DUP" : "ok ", n, v.length, v.join(","));
console.log("total names:", Object.keys(by).length);
