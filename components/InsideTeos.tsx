import { DICTS, type Dict } from "../lib/i18n";

// Badge shown directly next to every short-form country name, e.g. YOURNAME.EG [inside TEOS].
// With a dictionary it shows that language; without one it shows English and Arabic.
export default function InsideTeos({ t }: { t?: Dict }) {
  const label = t ? t.insideTeos : `${DICTS.en.insideTeos} · ${DICTS.ar.insideTeos}`;
  return (
    <span data-testid="inside-teos" style={{ display: "inline-block", marginInline: "8px", padding: "1px 8px", border: "1px solid #ca8a04", borderRadius: 999, fontSize: "0.6em", fontWeight: 700, color: "#eab308", verticalAlign: "middle", whiteSpace: "nowrap", fontFamily: "system-ui, sans-serif" }}>{label}</span>
  );
}
