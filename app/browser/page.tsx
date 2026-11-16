"use client";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import SiteView from "../../components/SiteView";
import TeosNav from "../../components/TeosNav";
import type { SiteConfig } from "../../lib/sites";

const clean = (v: string) => v.trim().toLowerCase().replace(/^(teos:\/\/|https?:\/\/)/, "").replace(/\/.*$/, "").replace(/(\.teos)+$/, "").replace(/[^a-z0-9]/g, "");

type State = { kind: "idle" } | { kind: "loading" } | { kind: "site"; name: string; site: SiteConfig } | { kind: "empty"; name: string; registered: boolean | null } | { kind: "error" };

function Browser() {
  const q = useSearchParams();
  const router = useRouter();
  const [input, setInput] = useState(q.get("q") ?? "");
  const [state, setState] = useState<State>({ kind: "idle" });

  const open = useCallback(async (raw: string) => {
    const name = clean(raw);
    if (!name) return;
    setState({ kind: "loading" });
    try {
      const r = await fetch(`/api/site/${name}`);
      if (r.ok) { const j = await r.json(); setState({ kind: "site", name, site: j.site }); return; }
      if (r.status !== 404) { setState({ kind: "error" }); return; }
      const a = await fetch(`/api/availability?domain=${name}`).then((x) => x.json()).catch(() => null);
      setState({ kind: "empty", name, registered: a ? a.available === false : null });
    } catch { setState({ kind: "error" }); }
  }, []);

  useEffect(() => { const v = q.get("q"); if (v) { setInput(v); open(v); } }, [q, open]);

  function go(e: React.FormEvent) {
    e.preventDefault();
    const name = clean(input);
    if (name) router.push(`/browser?q=${name}`);
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#0b0b0b", color: "#f5f5f5" }}>
      <TeosNav />
      <form onSubmit={go} style={{ display: "flex", gap: 8, padding: 12, borderBottom: "1px solid rgba(180,130,30,0.4)", alignItems: "center" }}>
        <input dir="ltr" value={input} onChange={(e) => setInput(e.target.value)} placeholder="teos://name.teos" aria-label="TEOS address" autoCapitalize="none" autoCorrect="off" spellCheck={false}
          style={{ flex: 1, minWidth: 0, padding: "10px 14px", borderRadius: 999, border: "1px solid #444", background: "#161616", color: "#fff", fontSize: 16 }} />
        <button type="submit" style={{ background: "#ca8a04", color: "#000", padding: "10px 18px", fontWeight: 700, borderRadius: 999 }}>Go</button>
      </form>
      <div style={{ flex: 1 }}>
        {state.kind === "idle" && <p style={{ textAlign: "center", marginTop: 80, opacity: 0.7 }}>Type a .teos name to open its site.</p>}
        {state.kind === "loading" && <p style={{ textAlign: "center", marginTop: 80 }}>Loading...</p>}
        {state.kind === "error" && <p style={{ textAlign: "center", marginTop: 80 }}>Could not load this site. Try again.</p>}
        {state.kind === "site" && <SiteView name={state.name} site={state.site} />}
        {state.kind === "empty" && (
          <div style={{ textAlign: "center", marginTop: 80, padding: 20 }}>
            <h1 dir="ltr" style={{ fontFamily: "Cinzel, Georgia, serif", color: "#facc15" }}>{state.name.toUpperCase()}.TEOS</h1>
            {state.registered === false
              ? <><p>This name is not registered yet.</p><a href={`/buy/${state.name}`} style={{ color: "#facc15" }}>Buy {state.name}.teos</a></>
              : <p>{state.registered ? "Registered, but the owner has not published a site yet." : "No site published."}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Page() { return <Suspense><Browser /></Suspense>; }
