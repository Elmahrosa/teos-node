import { DICTS, type Dict } from "../lib/i18n";

// Required legal notice: English and Arabic always shown, plus the active locale when it is a third language.
export default function Disclaimer({ t, compact }: { t?: Dict; compact?: boolean }) {
  const en = DICTS.en.disclaimer, ar = DICTS.ar.disclaimer;
  const extra = t && t.disclaimer !== en && t.disclaimer !== ar ? t.disclaimer : null;
  const style: React.CSSProperties = { margin: "8px 0 0", fontSize: compact ? 11 : 12, lineHeight: 1.5, color: "#a89a80" };
  return (
    <div role="note" data-testid="teos-disclaimer" style={{ margin: compact ? "10px 0 0" : "14px auto 0", maxWidth: 720, textAlign: "start" }}>
      <p lang="en" dir="ltr" style={style}>{en}</p>
      <p lang="ar" dir="rtl" style={style}>{ar}</p>
      {extra && <p style={style}>{extra}</p>}
    </div>
  );
}
