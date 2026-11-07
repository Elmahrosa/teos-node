// Generates FOUNDER_PASSWORD_HASH (scrypt, random salt) and a FOUNDER_SESSION_SECRET.
// Usage:  node scripts/hash-password.mjs            (prompts, input hidden)
//         FOUNDER_PW=... node scripts/hash-password.mjs   (used by teos-node-fix.ps1)
//         node scripts/hash-password.mjs "pw"       (avoid: ends up in shell history)
import crypto from "node:crypto";
import readline from "node:readline";

function ask(q) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (s) => { if (s.includes(q)) process.stdout.write(s); };
    rl.question(q, (a) => { rl.close(); process.stdout.write("\n"); resolve(a); });
  });
}

const pw = process.env.FOUNDER_PW ?? process.argv[2] ?? (await ask("Founder password (min 14 chars): "));
if (pw.length < 14) { console.error("Password too short (use 14+ characters)."); process.exit(1); }

const N = 65536, r = 8, p = 1;
const salt = crypto.randomBytes(16);
const key = crypto.scryptSync(pw, salt, 64, { N, r, p, maxmem: 256 * 1024 * 1024 });
console.log("\nSet these in Railway > Variables (and delete FOUNDER_PASSWORD):\n");
console.log(`FOUNDER_PASSWORD_HASH=scrypt$${N}$${r}$${p}$${salt.toString("base64")}$${key.toString("base64")}`);
console.log(`FOUNDER_SESSION_SECRET=${crypto.randomBytes(48).toString("base64url")}`);
console.log("\nNothing was written to disk.");