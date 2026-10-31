import fs from 'fs'
const HELIUS = `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_KEY}`
async function call(method, params){
  const res = await fetch(HELIUS, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({jsonrpc:"2.0",id:1,method,params}) })
  return (await res.json()).result
}
async function main(){
  const trees = ["Bk7LekRCvMZferKLtnNTGUMZWD2fyDitenG7c3UDjvgL","hYN2hgbQ36pFRvdo1dBLhfFV4LKNkhyu29XENpkMJZf"]
  for(const t of trees){
    const data = await call("getAssetsByGroup", {groupKey:"collection", groupValue:t, page:1, limit:100})
    // لو مش collection، جرب getAssetsByOwner
    console.log(`\n=== شجرة ${t.slice(0,8)} ===`)
    const ownerData = await call("getAssetsByOwner", {ownerAddress:"3jDzy3rR9VpxXhCnnRpZ2wXQxpprQDNGT2XpL6knGLzG", page:1, limit:100})
    const inTree = ownerData.items.filter(i => i.compression?.tree === t)
    console.log(`فاضل حي في الشجرة دي: ${inTree.length}`)
    inTree.forEach(a => console.log(" -", a.id, a.content?.metadata?.name))
  }
  const all = await call("getAssetsByOwner", {ownerAddress:"3jDzy3rR9VpxXhCnnRpZ2wXQxpprQDNGT2XpL6knGLzG", page:1, limit:100})
  console.log(`\nاجمالي اللي فاضل في محفظتك كلها: ${all.items.length}`)
}
main()
