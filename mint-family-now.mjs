import fs from "fs";
const FAMILY = ["ASHRAF","ANAS","AMIRA","EKRAM","EHAB","ALEXANDRIA","EL-MAHROSA"];
const OWNER = "EL-MAHROSA-VAULT";
if (!fs.existsSync("./vault")) fs.mkdirSync("./vault");
console.log("🔥 بعمل MINT للعيلة دلوقتي...");
for (const name of FAMILY) {
  const record = {
    domain: `${name}.TEOS`,
    owner: OWNER,
    sealed: true,
    mintedAt: new Date().toISOString(),
    price: "FAMILY - NOT FOR SALE"
  };
  fs.writeFileSync(`./vault/${name}.TEOS.json`, JSON.stringify(record, null, 2));
  console.log(`✅ ${name}.TEOS -> MINTED`);
}
console.log("🎉 خلصت! الـ 7 بقوا في الـ Vault");
