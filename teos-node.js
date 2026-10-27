// TEOS NODE - Genesis 1/1 - Alexandria
// ELM-INT-WEB4-001 - LAW OVER CODE
// Owner: AYMAN.TEOS

import fs from 'fs';

const LAW = "LAW OVER CODE";
const NODE = "Genesis Node Alexandria";
const OWNER = "AYMAN.TEOS";

console.log(`🔱 ${NODE} | ${OWNER} | ${LAW}`);

function loadDomains() {
  const files = ['domains/genesis.json', 'domains/central-banks-reserve.json', 'domains/reserved-list.json'];
  let all = {};
  files.forEach(f => {
    if (fs.existsSync(f)) {
      const data = JSON.parse(fs.readFileSync(f, 'utf8'));
      console.log(`✓ Loaded: ${f}`);
      all[f] = data;
    }
  });
  return all;
}

function resolve(domain) {
  const d = domain.toUpperCase();
  const db = loadDomains();
  const genesis = db['domains/genesis.json'];
  const banks = db['domains/central-banks-reserve.json'];
  const reserved = db['domains/reserved-list.json'];
  
  if (d === genesis?.domain) return { status: "SEALED GENESIS", owner: genesis.owner, law: LAW };
  if (banks?.giants?.find(b => b.domain === d)) return { status: "RESERVED AUCTION", collection: "CENTRALBANKS.TEOS", price: "1,000,000 EGP" };
  if (reserved?.premium_global?.includes(d) || reserved?.premium_eg?.includes(d)) return { status: "RESERVED", owner: OWNER };

  return { status: "AVAILABLE FOR MINT", domain: d, resolver: "teos-node" };
}

// CLI
const arg = process.argv[2];
if (arg && arg !== 'seal') {
  console.log(resolve(arg));
} else if (arg === 'seal') {
  loadDomains();
  console.log(`\n⚜️ NODE SEALED: ${NODE} - 25/10/2026 - ${OWNER}`);
  console.log(`Seal Image: ./seal.png`);
} else {
  loadDomains();
  console.log("\nUsage: node teos-node.js AYMAN.TEOS");
  console.log("       node teos-node.js seal");
}

export { resolve, loadDomains };
