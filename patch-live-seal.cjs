const fs = require('fs');
const path = require('path');

const RESERVED = ["ASHRAF","ANAS","AMIRA","EKRAM","EHAB","ALEXANDRIA","EL-MAHROSA"];

function patchFile(filePath) {
  if (!fs.existsSync(filePath)) return false;
  let code = fs.readFileSync(filePath, 'utf8');
  
  // Inject check at top of pricing function
  if (code.includes('FAMILY_SEALED_CHECK')) return true; // already patched
  
  const sealCheck = `
// FAMILY_SEALED_CHECK - DO NOT REMOVE
  const FAMILY_RESERVED = ${JSON.stringify(RESERVED)};
  if (FAMILY_RESERVED.includes((name || domain || "").toString().toUpperCase().replace(".TEOS",""))) {
    return { price: null, sealed: true, label: "🔒 SEALED - FAMILY NOT FOR SALE", ownedBy: "EL-MAHROSA-VAULT" };
  }
  // END FAMILY_SEALED_CHECK
`;

  // Try to inject after function calculatePrice or getPrice
  if (code.includes('function calculatePrice')) {
    code = code.replace('function calculatePrice', `${sealCheck}\nfunction calculatePrice`);
  } else if (code.includes('function getPrice')) {
    code = code.replace('function getPrice', `${sealCheck}\nfunction getPrice`);
  }
  
  // Also replace the UI text $5 TODAY ONLY for reserved
  code = code.replace(/\$5 USDC.*TODAY ONLY/g, '🔒 SEALED - NOT FOR SALE');
  
  fs.writeFileSync(filePath, code, 'utf8');
  console.log(`✅ Patched ${filePath}`);
  return true;
}

const candidates = [
  "./app/page.tsx",
  "./app/lib/pricing.ts",
  "./lib/pricing.ts",
  "./src/lib/pricing.ts",
  "./web4/app/page.tsx",
  "./teos-node.js",
  "./index.js",
  "./app.js"
];

let patched = 0;
candidates.forEach(f => { if (patchFile(f)) patched++; });

if (patched === 0) {
  console.log("⚠️ Could not auto-find file, creating override file...");
  fs.writeFileSync("./FAMILY_SEALED.json", JSON.stringify(RESERVED, null, 2));
}

console.log(`Done - ${patched} files patched`);
