import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import fs from "fs";
const OWNER = "3jDzy3rRpuM1aPje3p8xV4bN6dR9a8uTqW7Yx2b5c1d9e8";
const RPC = "https://api.mainnet-beta.solana.com";
const PATH = process.env.KEYPAIR_PATH || "C:\\Users\\aams1\\teos-fresh\\wallet.json";
const DRY = process.env.DRY === "1";

const kp = Keypair.fromSecretKey(new Uint8Array(JSON.parse(fs.readFileSync(PATH,"utf8"))));
console.log("using", kp.publicKey.toString());
if(kp.publicKey.toString().slice(0,4) !== "3jDz") throw new Error("wrong wallet");

const conn = new Connection(RPC, "confirmed");

// هنا هنستخدم نفس لوجيك الحرق القديم بس على public RPC
// لو السكريبت القديم عندك شغال، هنشغله على public
import("./burn-dups.mjs");