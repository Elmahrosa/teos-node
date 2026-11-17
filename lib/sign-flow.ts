// Client-side helpers for wallet message signing.
//
// Why this exists: a mobile wallet (MetaMask) can approve a signature inside its own app and never
// hand the result back to the page that asked. The old code awaited signMessage() forever, so the
// button stayed on "Checking..." with no request sent and no error shown. Every request is now
// bounded, the failure is reported in words, and a signature that did arrive is cached so finishing
// the verification never asks the wallet again.

export const SIGN_REQUEST_TIMEOUT_MS = 90_000;
export const VERIFY_REQUEST_TIMEOUT_MS = 20_000;

export class TimeoutError extends Error {
  readonly phase: "sign" | "verify";
  constructor(phase: "sign" | "verify") {
    super(phase === "sign" ? "wallet did not return a signature" : "verification request timed out");
    this.name = "TimeoutError";
    this.phase = phase;
  }
}

// A server-issued timestamp is only usable while it is inside the route's age window. Small negative
// skew is allowed because the wallet clock and this clock are not the same clock.
export function isProofFresh(ts: number, now: number, ttlMs: number, skewMs = 60_000): boolean {
  if (!Number.isFinite(ts)) return false;
  const age = now - ts;
  return age >= -skewMs && age <= ttlMs;
}

export function withTimeout<T>(work: Promise<T>, ms: number, phase: "sign" | "verify" = "sign"): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError(phase)), ms);
    work.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
}

// Wallets are supposed to return Uint8Array. Some return { signature } (and some return nothing at
// all); normalize here instead of silently sending an empty signature to the server.
export function signatureToBase64(sig: unknown): string | null {
  const bytes =
    sig instanceof Uint8Array
      ? sig
      : sig && typeof sig === "object" && (sig as any).signature instanceof Uint8Array
        ? ((sig as any).signature as Uint8Array)
        : null;
  if (!bytes || bytes.length === 0) return null;
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

export type Proof = { name: string; ts: number; signature: string; publicKey: string };

const STORAGE_PREFIX = "teos:sig:";

function storage(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.sessionStorage : null;
  } catch {
    return null;
  }
}

export function saveProof(proof: Proof): void {
  try {
    storage()?.setItem(STORAGE_PREFIX + proof.name, JSON.stringify(proof));
  } catch {
    // Storage can be full or blocked (private mode). The in-memory flow still works.
  }
}

export function readProof(name: string, ttlMs: number, now = Date.now()): Proof | null {
  try {
    const raw = storage()?.getItem(STORAGE_PREFIX + name);
    if (!raw) return null;
    const p: unknown = JSON.parse(raw);
    const proof = p as Proof;
    if (!proof || typeof proof.signature !== "string" || typeof proof.publicKey !== "string") return null;
    if (!isProofFresh(proof.ts, now, ttlMs)) {
      storage()?.removeItem(STORAGE_PREFIX + name);
      return null;
    }
    return proof;
  } catch {
    return null;
  }
}

export function clearProof(name: string): void {
  try {
    storage()?.removeItem(STORAGE_PREFIX + name);
  } catch {
    // ignore
  }
}

// POST/GET with a hard timeout, so a stalled network or server never leaves a spinner running.
export async function fetchJson(
  url: string,
  init: RequestInit = {},
  timeoutMs = VERIFY_REQUEST_TIMEOUT_MS
): Promise<{ ok: boolean; status: number; json: any }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal });
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, json };
  } catch (e) {
    // Our own abort means the server did not answer in time. Report it as a timeout so the UI can say
    // "the signature is saved, press Resume" instead of blaming the wallet.
    if ((e as { name?: string } | null)?.name === "AbortError") throw new TimeoutError("verify");
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
