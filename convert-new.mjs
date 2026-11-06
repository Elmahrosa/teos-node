import fs from "fs";
import readline from "readline";
import { base58 } from "@metaplex-foundation/umi";
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question("Paste Teos-Core private key: ", (s) => {
  const t = s.trim();
  try {
    const bytes = base58.serialize(t);
    console.log("decoded bytes:", bytes.length);
    fs.writeFileSync("NEW.json", JSON.stringify(Array.from(bytes)));
    console.log("NEW.json saved OK");
  } catch(e) { console.log("STILL BAD:", e.message); }
  rl.close();
});
