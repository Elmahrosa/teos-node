import crypto from "crypto";
import { env } from "./env";

const secret = () => env("FOUNDER_SESSION_SECRET") ?? "";
const h = (s: string) => crypto.createHmac("sha256", secret()).update(s).digest("hex");

export function signSession(maxAgeSec = 604800) {
  const exp = String(Math.floor(Date.now() / 1000) + maxAgeSec);
  return `${exp}.${h(exp)}`;
}

export function verifySession(cookieHeader: string | null): boolean {
  if (!secret()) return false;
  const m = /(?:^|;\s*)founder-auth=([^;]+)/.exec(cookieHeader || "");
  if (!m) return false;
  const [exp, mac] = decodeURIComponent(m[1]).split(".");
  if (!exp || !mac || Number(exp) < Date.now() / 1000) return false;
  const a = Buffer.from(mac), b = Buffer.from(h(exp));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function passwordOk(input: string) {
  const exp = env("FOUNDER_PASSWORD");
  if (!exp) return false;
  const d = (s: string) => crypto.createHash("sha256").update(s).digest();
  return crypto.timingSafeEqual(d(input), d(exp));
}