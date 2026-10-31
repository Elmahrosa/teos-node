const KEY = process.env.HELIUS_KEY;
const ids = [
  "56n6VRTWEPx1Z8k6gWpxvPU1bnhGBH8z2554rZKkRi8W",
  "3R1VCighQEabwEqrJ5kRzsb23FxJwZngG65fj9g2Bkhf"
];
for (const id of ids) {
  const r = await fetch(`https://mainnet.helius-rpc.com/?api-key=${KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getAsset", params: { id } })
  });
  const a = (await r.json()).result;
  console.log(a?.content?.metadata?.name, "burnt:", a?.burnt, "owner:", a?.ownership?.owner);
}
