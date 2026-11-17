"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { useLang } from "../../lib/useLang";
import type { Lang } from "../../lib/i18n";

// Connected-wallet level only: the keys stay in Phantom/Solflare. TEOS reads the public address,
// lists the names it holds on-chain in every known namespace, and relays a transfer the user signed in their own wallet.

type NameRow = { name: string; label: string; tld: string; verified: boolean; published: boolean };
type Summary = { names: NameRow[]; balanceSol: number | null };
type Status = { text: string; kind: "info" | "error" | "ok" };

type Txt = {
  title: string;
  intro: string;
  connectHint: string;
  connected: string;
  balance: string;
  balanceUnavailable: string;
  names: string;
  noNames: string;
  published: string;
  noSite: string;
  designPublish: string;
  onlyTeos: string;
  unverified: string;
  openSite: string;
  design: string;
  send: string;
  sendHint: string;
  recipient: string;
  recipientPlaceholder: string;
  amount: string;
  resolved: string;
  resolving: string;
  sendBtn: string;
  sending: string;
  sent: string;
  view: string;
  badAmount: string;
  badRecipient: string;
  noName: string;
  ownerChanged: string;
  checkUnavailable: string;
  resolveFailed: string;
  cancelled: string;
  sendFailed: string;
  noSign: string;
  rateLimited: string;
  rpcUnavailable: string;
  refresh: string;
  loading: string;
};

const TXT: Record<Lang, Txt> = {
  en: {
    title: "Your sovereign wallet",
    intro: "Connect a Solana wallet you control. TEOS shows the names your wallet holds on-chain and lets you send SOL — it never holds your keys.",
    connectHint: "Connect a wallet to see your names and balance.",
    connected: "Connected",
    balance: "SOL balance",
    balanceUnavailable: "Unavailable right now",
    names: "Your on-chain names",
    noNames: "This wallet does not hold a TEOS name yet.",
    published: "Published",
    noSite: "No site yet",
    designPublish: "Design and publish",
    onlyTeos: "Publishing currently supports .teos names only.",
    unverified: "Ownership not verified",
    openSite: "Open site",
    design: "Design",
    send: "Send SOL",
    sendHint: "You approve the transfer in your own wallet. TEOS only relays the signed transaction.",
    recipient: "Recipient address or .teos name",
    recipientPlaceholder: "Address or name.teos",
    amount: "Amount (SOL)",
    resolved: "Sends to",
    resolving: "Resolving…",
    sendBtn: "Sign and send",
    sending: "Waiting for your wallet…",
    sent: "Sent. Confirmation is running on Solana.",
    view: "View on Solscan",
    badAmount: "Enter an amount greater than 0.",
    badRecipient: "Enter a Solana address or a registered .teos name.",
    noName: "That .teos name is not registered.",
    ownerChanged: "That name changed owner on-chain. Refresh and check the address before sending.",
    checkUnavailable: "The .teos ownership check is unavailable. Try again in a moment.",
    resolveFailed: "Could not resolve that recipient.",
    cancelled: "Signing was cancelled.",
    sendFailed: "The network rejected the transfer.",
    noSign: "This wallet cannot sign a transfer here. Try Phantom or Solflare.",
    rateLimited: "Too many attempts. Wait a minute and try again.",
    rpcUnavailable: "The Solana RPC is unavailable. Try again.",
    refresh: "Refresh",
    loading: "Loading your wallet…",
  },
  ar: {
    title: "محفظتك السيادية",
    intro: "اربط محفظة Solana تملكها. تيوس يعرض الأسماء الموجودة على الشبكة ويتيح إرسال SOL — ولا يحتفظ بمفاتيحك أبدًا.",
    connectHint: "اربط محفظة لعرض أسمائك ورصيدك.",
    connected: "متصل",
    balance: "رصيد SOL",
    balanceUnavailable: "غير متاح حاليًا",
    names: "أسماؤك على الشبكة",
    noNames: "هذه المحفظة لا تملك أي اسم TEOS بعد.",
    published: "منشور",
    noSite: "لا موقع بعد",
    designPublish: "صمّم وانشر",
    onlyTeos: "النشر يدعم أسماء .teos فقط حالياً.",
    unverified: "لم يتم التحقق من الملكية",
    openSite: "افتح الموقع",
    design: "صمّم",
    send: "إرسال SOL",
    sendHint: "أنت توافق على التحويل داخل محفظتك. تيوس يمرّر المعاملة الموقّعة فقط.",
    recipient: "عنوان المستلم أو اسم .teos",
    recipientPlaceholder: "عنوان أو name.teos",
    amount: "المبلغ (SOL)",
    resolved: "يُرسل إلى",
    resolving: "جارٍ التحقق…",
    sendBtn: "وقّع وأرسل",
    sending: "بانتظار محفظتك…",
    sent: "تم الإرسال. التأكيد يجري على سولانا.",
    view: "اعرض على Solscan",
    badAmount: "أدخل مبلغًا أكبر من صفر.",
    badRecipient: "أدخل عنوان Solana أو اسم .teos مسجّل.",
    noName: "اسم .teos هذا غير مسجّل.",
    ownerChanged: "تغيّر مالك هذا الاسم على الشبكة. حدّث الصفحة وتحقق من العنوان قبل الإرسال.",
    checkUnavailable: "فحص ملكية .teos غير متاح. حاول بعد قليل.",
    resolveFailed: "تعذّر التحقق من المستلم.",
    cancelled: "تم إلغاء التوقيع.",
    sendFailed: "رفضت الشبكة التحويل.",
    noSign: "هذه المحفظة لا تدعم توقيع التحويل هنا. جرّب Phantom أو Solflare.",
    rateLimited: "محاولات كثيرة. انتظر دقيقة ثم حاول.",
    rpcUnavailable: "شبكة Solana غير متاحة. حاول مرة أخرى.",
    refresh: "تحديث",
    loading: "جارٍ تحميل محفظتك…",
  },
  id: {
    title: "Dompet kedaulatan Anda",
    intro: "Hubungkan dompet Solana milik Anda. TEOS menampilkan nama yang dipegang dompet Anda di rantai dan mengirim SOL — TEOS tidak pernah menyimpan kunci Anda.",
    connectHint: "Hubungkan dompet untuk melihat nama dan saldo Anda.",
    connected: "Terhubung",
    balance: "Saldo SOL",
    balanceUnavailable: "Tidak tersedia saat ini",
    names: "Nama on-chain Anda",
    noNames: "Dompet ini belum memiliki nama TEOS.",
    published: "Terbit",
    noSite: "Belum ada situs",
    designPublish: "Desain dan terbitkan",
    onlyTeos: "Penerbitan saat ini hanya mendukung nama .teos.",
    unverified: "Kepemilikan belum terverifikasi",
    openSite: "Buka situs",
    design: "Desain",
    send: "Kirim SOL",
    sendHint: "Anda menyetujui transfer di dompet Anda sendiri. TEOS hanya meneruskan transaksi yang sudah ditandatangani.",
    recipient: "Alamat penerima atau nama .teos",
    recipientPlaceholder: "Alamat atau name.teos",
    amount: "Jumlah (SOL)",
    resolved: "Dikirim ke",
    resolving: "Memeriksa…",
    sendBtn: "Tandatangani dan kirim",
    sending: "Menunggu dompet Anda…",
    sent: "Terkirim. Konfirmasi berjalan di Solana.",
    view: "Lihat di Solscan",
    badAmount: "Masukkan jumlah lebih dari 0.",
    badRecipient: "Masukkan alamat Solana atau nama .teos terdaftar.",
    noName: "Nama .teos itu belum terdaftar.",
    ownerChanged: "Nama itu berganti pemilik di rantai. Segarkan dan periksa alamat sebelum mengirim.",
    checkUnavailable: "Pemeriksaan kepemilikan .teos tidak tersedia. Coba lagi nanti.",
    resolveFailed: "Tidak dapat memverifikasi penerima.",
    cancelled: "Penandatanganan dibatalkan.",
    sendFailed: "Jaringan menolak transfer.",
    noSign: "Dompet ini tidak dapat menandatangani transfer di sini. Coba Phantom atau Solflare.",
    rateLimited: "Terlalu banyak percobaan. Tunggu satu menit.",
    rpcUnavailable: "RPC Solana tidak tersedia. Coba lagi.",
    refresh: "Segarkan",
    loading: "Memuat dompet Anda…",
  },
};

const B58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const b64 = (u: Uint8Array) => btoa(String.fromCharCode(...Array.from(u)));
const nameOf = (v: string) => v.trim().toLowerCase().replace(/\.teos$/, "");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const short = (v: string) => (v.length <= 18 ? v : `${v.slice(0, 8)}…${v.slice(-6)}`);

const card: React.CSSProperties = {
  background: "linear-gradient(160deg,#2a2520,#1a1611)",
  border: "1px solid #3d352a",
  borderRadius: 12,
  padding: 20,
  marginTop: 16,
};
const field: React.CSSProperties = { width: "100%", padding: 10, background: "#161616", color: "#fff", border: "1px solid #444", borderRadius: 8, marginTop: 4, boxSizing: "border-box" };
const btn: React.CSSProperties = { background: "#ca8a04", color: "#000", padding: "10px 18px", fontWeight: 700, borderRadius: 8, cursor: "pointer" };
const nameLink: React.CSSProperties = { color: "#facc15", textDecoration: "none", fontWeight: 600 };
const badge: React.CSSProperties = { display: "inline-block", fontSize: 11, padding: "2px 8px", borderRadius: 999, border: "1px solid #57493a", marginInlineEnd: 8 };

function resolveError(code: string, t: Txt): string {
  switch (code) {
    case "no_name": return t.noName;
    case "owner_changed": return t.ownerChanged;
    case "ownership_check_unavailable": return t.checkUnavailable;
    case "invalid_name": return t.badRecipient;
    case "rate_limited": return t.rateLimited;
    default: return t.resolveFailed;
  }
}

export default function WalletClient() {
  const { publicKey, connected, signTransaction } = useWallet();
  const { connection } = useConnection();
  const { lang, rtl } = useLang();
  const t = TXT[lang] ?? TXT.en;
  const wallet = publicKey?.toBase58() ?? null;

  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [recipient, setRecipient] = useState("");
  const [resolved, setResolved] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [resolveErrorCode, setResolveErrorCode] = useState<string | null>(null);

  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);
  const [signature, setSignature] = useState<string | null>(null);

  const load = useCallback(async (w: string) => {
    setLoading(true);
    setLoadError(null);
    try {
      const r = await fetch(`/api/wallet/summary?wallet=${encodeURIComponent(w)}`);
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setLoadError(j.error === "rpc_unavailable" || j.error === "ownership_unavailable" ? "rpc_unavailable" : "failed");
        setSummary(null);
        return;
      }
      setSummary({
        names: Array.isArray(j.names)
          ? j.names
              .filter((n: any) => n && typeof n.name === "string" && typeof n.label === "string" && typeof n.tld === "string")
              .map((n: any) => ({ name: n.name, label: n.label, tld: n.tld, verified: n.verified === true, published: n.published === true }))
          : [],
        balanceSol: typeof j.balanceSol === "number" ? j.balanceSol : null,
      });
    } catch {
      setLoadError("failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSummary(null);
    setLoadError(null);
    if (wallet) load(wallet);
  }, [wallet, load]);

  // Resolve the recipient as the user types. A name is confirmed on-chain by the server before it
  // becomes a destination, so a stale registry entry can never silently redirect a transfer.
  useEffect(() => {
    const value = recipient.trim();
    setResolved(null);
    setResolveErrorCode(null);
    if (!value) return;
    if (B58.test(value)) {
      try {
        new PublicKey(value);
        setResolved(value);
      } catch {
        setResolveErrorCode("invalid_name");
      }
      return;
    }
    const name = nameOf(value);
    if (!/^[a-z0-9-]{1,30}$/.test(name)) {
      setResolveErrorCode("invalid_name");
      return;
    }
    let alive = true;
    setResolving(true);
    const timer = setTimeout(async () => {
      try {
        const r = await fetch(`/api/wallet/resolve?name=${encodeURIComponent(name)}`);
        const j = await r.json().catch(() => ({}));
        if (!alive) return;
        if (r.ok && typeof j.wallet === "string" && B58.test(j.wallet)) setResolved(j.wallet);
        else setResolveErrorCode(typeof j.error === "string" ? j.error : "resolve_failed");
      } catch {
        if (alive) setResolveErrorCode("resolve_failed");
      } finally {
        if (alive) setResolving(false);
      }
    }, 350);
    return () => {
      alive = false;
      clearTimeout(timer);
      setResolving(false);
    };
  }, [recipient]);

  async function confirmSent(sig: string, w: string | null) {
    for (let i = 0; i < 10; i++) {
      await sleep(1200);
      try {
        const res = await connection.getSignatureStatuses([sig]);
        const value = res.value[0];
        if (value?.err) {
          setStatus({ text: t.sendFailed, kind: "error" });
          return;
        }
        if (value && (value.confirmationStatus === "confirmed" || value.confirmationStatus === "finalized")) break;
      } catch {
        // Keep polling: a transient RPC failure is not a failed transfer.
      }
    }
    if (w) load(w);
  }

  async function send() {
    if (busy) return;
    if (!publicKey || !signTransaction) {
      setStatus({ text: publicKey ? t.noSign : t.connectHint, kind: publicKey ? "error" : "info" });
      return;
    }
    if (!resolved) {
      setStatus({ text: resolveErrorCode ? resolveError(resolveErrorCode, t) : t.badRecipient, kind: "error" });
      return;
    }
    const sol = Number(amount.replace(",", "."));
    if (!/^\d*[.,]?\d*$/.test(amount.trim()) || !Number.isFinite(sol) || sol <= 0) {
      setStatus({ text: t.badAmount, kind: "error" });
      return;
    }
    const lamports = Math.round(sol * LAMPORTS_PER_SOL);
    if (lamports <= 0 || !Number.isSafeInteger(lamports)) {
      setStatus({ text: t.badAmount, kind: "error" });
      return;
    }

    setBusy(true);
    setStatus({ text: t.sending, kind: "info" });
    setSignature(null);
    try {
      const to = new PublicKey(resolved);
      const { blockhash } = await connection.getLatestBlockhash("confirmed");
      const tx = new Transaction().add(SystemProgram.transfer({ fromPubkey: publicKey, toPubkey: to, lamports }));
      tx.feePayer = publicKey;
      tx.recentBlockhash = blockhash;
      const signed = await signTransaction(tx);
      const raw = b64(signed.serialize());

      const r = await fetch("/api/wallet/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ transaction: raw, wallet: publicKey.toBase58() }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || typeof j.signature !== "string" || !j.signature) {
        const text =
          j.error === "rate_limited" ? t.rateLimited :
          j.error === "rpc_unavailable" ? t.rpcUnavailable :
          t.sendFailed;
        setStatus({ text, kind: "error" });
        return;
      }

      setSignature(j.signature);
      setStatus({ text: t.sent, kind: "ok" });
      setAmount("");
      void confirmSent(j.signature, wallet);
    } catch (e: any) {
      const message = String(e?.message ?? "").slice(0, 100);
      setStatus({ text: /reject|denied|declin|cancel/i.test(message) ? t.cancelled : `${t.sendFailed}${message ? ` (${message})` : ""}`, kind: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main dir={rtl ? "rtl" : "ltr"} style={{ maxWidth: 860, margin: "0 auto", padding: "28px 18px 60px" }}>
      <h1 style={{ fontFamily: "Cinzel, Georgia, serif", color: "gold", fontSize: 30, margin: "0 0 8px" }}>{t.title}</h1>
      <p style={{ margin: 0, opacity: 0.85, lineHeight: 1.6 }}>{t.intro}</p>

      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <WalletMultiButton />
          {connected && wallet && (
            <button type="button" onClick={() => load(wallet)} disabled={loading} style={{ background: "transparent", border: "1px solid #57493a", color: "#d6cbb5", borderRadius: 8, padding: "8px 12px", cursor: "pointer" }}>
              {loading ? t.loading : t.refresh}
            </button>
          )}
        </div>

        {!connected && <p style={{ margin: "14px 0 0", opacity: 0.8 }}>{t.connectHint}</p>}

        {connected && wallet && (
          <>
            <p style={{ margin: "16px 0 0", fontSize: 13, opacity: 0.65 }}>
              {t.connected}: <code style={{ wordBreak: "break-all" }}>{wallet}</code>
            </p>

            <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginTop: 18 }}>
              <div>
                <div style={{ fontSize: 12, letterSpacing: 1, opacity: 0.6, textTransform: "uppercase" }}>{t.balance}</div>
                <div style={{ fontSize: 30, fontWeight: 700, color: "#facc15", marginTop: 4 }}>
                  {summary
                    ? summary.balanceSol === null
                      ? t.balanceUnavailable
                      : `${summary.balanceSol.toFixed(4)} SOL`
                    : "—"}
                </div>
              </div>
            </div>

            {loadError && <p style={{ margin: "10px 0 0", color: "#fca5a5", fontSize: 13 }}>{loadError === "rpc_unavailable" ? t.rpcUnavailable : t.balanceUnavailable}</p>}

            <h2 style={{ marginTop: 24, fontSize: 18, color: "#facc15" }}>{t.names}</h2>
            {summary && summary.names.length === 0 && <p style={{ margin: "6px 0 0", opacity: 0.75 }}>{t.noNames}</p>}
            {summary && summary.names.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 10, marginTop: 10 }}>
                {summary.names.map((n) => (
                  <div key={n.name} style={{ border: "1px solid #3d352a", borderRadius: 10, padding: 12, background: "rgba(0,0,0,0.25)" }}>
                    <div dir="ltr" style={{ fontWeight: 700, color: "#facc15", wordBreak: "break-word" }}>{n.name}</div>
                    <div style={{ marginTop: 8 }}>
                      <span style={{ ...badge, color: n.published ? "#86efac" : "#d6cbb5", borderColor: n.published ? "#3f6b4f" : "#57493a" }}>
                        {n.published ? t.published : t.noSite}
                      </span>
                      {!n.verified && <span style={{ ...badge, color: "#fcd34d", borderColor: "#6b5a2a" }}>{t.unverified}</span>}
                    </div>
                    <div style={{ display: "flex", gap: 14, marginTop: 8, fontSize: 13, flexWrap: "wrap", alignItems: "center" }}>
                      {n.published && n.tld === "teos" && <Link href={`/s/${n.label}`} style={nameLink}>{t.openSite}</Link>}
                      {n.tld === "teos" ? (
                        <Link href={`/builder/${n.label}`} style={nameLink}>{n.published ? t.design : t.designPublish}</Link>
                      ) : (
                        <span style={{ opacity: 0.55 }}>{t.onlyTeos}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {connected && (
        <div style={card}>
          <h2 style={{ margin: 0, fontSize: 20, color: "#facc15" }}>{t.send}</h2>
          <p style={{ margin: "6px 0 16px", fontSize: 13, opacity: 0.75, lineHeight: 1.5 }}>{t.sendHint}</p>

          <label style={{ display: "block" }}>
            <span style={{ fontSize: 13, opacity: 0.8 }}>{t.recipient}</span>
            <input
              dir="ltr"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder={t.recipientPlaceholder}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              style={field}
            />
          </label>
          <p style={{ margin: "6px 0 0", fontSize: 13, minHeight: 18, opacity: 0.8 }}>
            {resolving
              ? t.resolving
              : resolveErrorCode
                ? <span style={{ color: "#fca5a5" }}>{resolveError(resolveErrorCode, t)}</span>
                : resolved
                  ? <>{t.resolved}: <code title={resolved} dir="ltr">{short(resolved)}</code></>
                  : null}
          </p>

          <label style={{ display: "block", marginTop: 10 }}>
            <span style={{ fontSize: 13, opacity: 0.8 }}>{t.amount}</span>
            <input
              dir="ltr"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              style={field}
            />
          </label>

          <div style={{ marginTop: 16 }}>
            <button type="button" onClick={send} disabled={busy} style={{ ...btn, width: "100%", padding: 14, fontSize: 16, opacity: busy ? 0.6 : 1 }}>
              {busy ? t.sending : t.sendBtn}
            </button>
          </div>

          {status && (
            <p style={{ margin: "12px 0 0", color: status.kind === "error" ? "#fca5a5" : status.kind === "ok" ? "#86efac" : "#e8dcc2", lineHeight: 1.5 }}>
              {status.text}
            </p>
          )}
          {signature && (
            <p style={{ margin: "6px 0 0", fontSize: 13 }}>
              <a href={`https://solscan.io/tx/${signature}`} target="_blank" rel="noopener noreferrer" style={nameLink}>{t.view}</a>
            </p>
          )}
        </div>
      )}
    </main>
  );
}
