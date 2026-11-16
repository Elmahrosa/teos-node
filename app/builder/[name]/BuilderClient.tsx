"use client";
import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import SiteView from "../../../components/SiteView";
import { EMPTY_SITE, THEMES, importMessage, siteMessage, type SiteConfig } from "../../../lib/sites";

const b64 = (u: Uint8Array) => btoa(String.fromCharCode(...Array.from(u)));
async function sha256Hex(s: string) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(d), (b) => b.toString(16).padStart(2, "0")).join("");
}
const field: React.CSSProperties = { width: "100%", padding: 10, background: "#161616", color: "#fff", border: "1px solid #444", borderRadius: 8, marginTop: 4 };
const btn: React.CSSProperties = { background: "#ca8a04", color: "#000", padding: "10px 18px", fontWeight: 700, borderRadius: 8 };

export default function BuilderClient({ name }: { name: string }) {
  const { publicKey, signMessage } = useWallet();
  const [site, setSite] = useState<SiteConfig>(EMPTY_SITE);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [published, setPublished] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [importBusy, setImportBusy] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/site/${name}`).then((r) => (r.ok ? r.json() : null)).then((j) => { if (j?.site) setSite({ ...EMPTY_SITE, ...j.site }); }).catch(() => {});
  }, [name]);

  const set = <K extends keyof SiteConfig>(k: K, v: SiteConfig[K]) => setSite((s) => ({ ...s, [k]: v }));

  async function importFromSite() {
    if (!publicKey || !signMessage) { setImportMsg("Connect the wallet that holds this name"); return; }
    const url = importUrl.trim();
    if (!/^https:\/\//i.test(url)) { setImportMsg("Use a full https:// address."); return; }
    setImportBusy(true); setImportMsg(null);
    try {
      const ts = Date.now();
      const sig = await signMessage(new TextEncoder().encode(importMessage(name, ts, await sha256Hex(url))));
      const r = await fetch(`/api/site/${name}/import`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ publicKey: publicKey.toBase58(), signature: b64(sig), ts, url }) });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.site) {
        setSite(j.site);
        setPublished(false);
        setImportMsg("Imported. Review the fields, then publish.");
      } else {
        const errors: Record<string, string> = {
          https_required: "Use a full https:// address.",
          bad_url: "That address is not valid.",
          private_host: "That address is not a public website.",
          fetch_failed: "Could not reach that site.",
          redirect_not_allowed: "That address redirects elsewhere. Use the final address.",
          not_html: "That link is not an HTML page.",
          too_large: "That page is too large to import.",
          not_owner: `This wallet does not hold ${name}.teos`,
          ownership_check_unavailable: "Ownership check unavailable, try again",
          invalid_signature: "Signature check failed, try again",
          signature_expired: "The signature expired, try again",
          rate_limited: "Too many imports. Wait a minute.",
        };
        setImportMsg(errors[j.error] || j.error || "Import failed");
      }
    } catch { setImportMsg("Signing cancelled or failed"); }
    setImportBusy(false);
  }

  async function publish() {
    if (!publicKey || !signMessage) { setMsg("Connect the wallet that holds this name"); return; }
    setBusy(true); setMsg(null);
    try {
      const content = JSON.stringify(site);
      const ts = Date.now();
      const sig = await signMessage(new TextEncoder().encode(siteMessage(name, ts, await sha256Hex(content))));
      const r = await fetch(`/api/site/${name}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ publicKey: publicKey.toBase58(), signature: b64(sig), ts, content }) });
      const j = await r.json().catch(() => ({}));
      if (r.ok) { setPublished(true); setMsg("Published."); }
      else setMsg(j.error === "not_owner" ? `This wallet does not hold ${name}.teos` : j.error === "ownership_check_unavailable" ? "Ownership check unavailable, try again" : (j.error || "Failed"));
    } catch { setMsg("Signing cancelled or failed"); }
    setBusy(false);
  }

  return (
    <div className="mx-auto mt-6 grid max-w-6xl gap-6" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))" }}>
      <div>
        <div style={{ marginBottom: 16 }}><WalletMultiButton /></div>
        <div style={{ marginBottom: 20, padding: 14, border: "1px solid #3d352a", borderRadius: 10, background: "rgba(0,0,0,0.25)" }}>
          <h3 style={{ margin: 0, fontWeight: 700 }}>Import from your existing website</h3>
          <p style={{ margin: "6px 0 10px", fontSize: 13, opacity: 0.75, lineHeight: 1.5 }}>
            We copy the title, text, image and links. No code from the other site runs here. This replaces the fields below.
          </p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <input
              dir="ltr"
              style={{ ...field, marginTop: 0, flex: "1 1 220px", width: "auto" }}
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              placeholder="https://your-company.com"
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
            <button type="button" disabled={importBusy || !publicKey} onClick={importFromSite} style={{ ...btn, opacity: importBusy || !publicKey ? 0.6 : 1 }}>
              {importBusy ? "Importing..." : "Import"}
            </button>
          </div>
          {importMsg && <p style={{ margin: "8px 0 0", fontSize: 13 }}>{importMsg}</p>}
        </div>
        <label>Title<input style={field} maxLength={80} value={site.title} onChange={(e) => set("title", e.target.value)} placeholder={`${name}.teos`} /></label>
        <label style={{ display: "block", marginTop: 12 }}>Tagline<input style={field} maxLength={160} value={site.tagline} onChange={(e) => set("tagline", e.target.value)} /></label>
        <label style={{ display: "block", marginTop: 12 }}>Header image (https URL)<input style={field} value={site.image} onChange={(e) => set("image", e.target.value)} placeholder="https://..." /></label>
        <div style={{ marginTop: 12 }}>Theme
          <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
            {THEMES.map((t) => <button key={t} type="button" onClick={() => set("theme", t)} aria-pressed={site.theme === t} style={{ ...btn, background: site.theme === t ? "#ca8a04" : "#222", color: site.theme === t ? "#000" : "#fff" }}>{t}</button>)}
          </div>
        </div>
        <h3 style={{ marginTop: 20, fontWeight: 700 }}>Sections</h3>
        {site.sections.map((s, i) => (
          <div key={i} style={{ marginTop: 8, padding: 10, border: "1px solid #333", borderRadius: 8 }}>
            <input style={field} maxLength={80} placeholder="Heading" value={s.heading} onChange={(e) => set("sections", site.sections.map((x, j) => (j === i ? { ...x, heading: e.target.value } : x)))} />
            <textarea style={{ ...field, minHeight: 90 }} maxLength={2000} placeholder="Text" value={s.body} onChange={(e) => set("sections", site.sections.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)))} />
            <button type="button" onClick={() => set("sections", site.sections.filter((_, j) => j !== i))} style={{ marginTop: 6, color: "#f87171" }}>Remove</button>
          </div>
        ))}
        {site.sections.length < 6 && <button type="button" style={{ ...btn, marginTop: 8 }} onClick={() => set("sections", [...site.sections, { heading: "", body: "" }])}>Add section</button>}
        <h3 style={{ marginTop: 20, fontWeight: 700 }}>Links</h3>
        {site.links.map((l, i) => (
          <div key={i} style={{ marginTop: 8, display: "flex", gap: 6 }}>
            <input style={{ ...field, marginTop: 0 }} maxLength={60} placeholder="Label" value={l.label} onChange={(e) => set("links", site.links.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
            <input style={{ ...field, marginTop: 0 }} placeholder="https://..." value={l.url} onChange={(e) => set("links", site.links.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
            <button type="button" aria-label="Remove link" onClick={() => set("links", site.links.filter((_, j) => j !== i))} style={{ color: "#f87171" }}>x</button>
          </div>
        ))}
        {site.links.length < 8 && <button type="button" style={{ ...btn, marginTop: 8 }} onClick={() => set("links", [...site.links, { label: "", url: "" }])}>Add link</button>}
        <div style={{ marginTop: 24 }}>
          <button type="button" disabled={busy || !publicKey} onClick={publish} style={{ ...btn, width: "100%", padding: 14, fontSize: 18, opacity: busy || !publicKey ? 0.6 : 1 }}>{busy ? "Publishing..." : "Sign and publish"}</button>
          {msg && <p style={{ marginTop: 10 }}>{msg}</p>}
          {published && <p style={{ marginTop: 6 }}><a style={{ color: "#facc15" }} href={`/browser?q=${name}`}>Open in TEOS Browser</a></p>}
        </div>
      </div>
      <div style={{ border: "1px solid rgba(180,130,30,0.4)", borderRadius: 12, overflow: "hidden", alignSelf: "start" }}>
        <p style={{ margin: 0, padding: "6px 12px", fontSize: 12, opacity: 0.7, borderBottom: "1px solid rgba(180,130,30,0.3)" }}>Live preview</p>
        <SiteView name={name} site={site} />
      </div>
    </div>
  );
}
