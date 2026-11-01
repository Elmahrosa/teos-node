// Gold line with a small ankh in the middle, used between page sections.
export default function Divider() {
  const line: React.CSSProperties = { flex: 1, height: 1, background: "linear-gradient(90deg,transparent,#b8860b,transparent)" };
  return (
    <div aria-hidden="true" style={{ display: "flex", alignItems: "center", gap: 12, margin: "28px 0" }}>
      <span style={line} />
      <svg viewBox="0 0 40 70" width="14" height="24"><g fill="none" stroke="#eab308" strokeWidth="5" strokeLinecap="round"><ellipse cx="20" cy="16" rx="11" ry="13" /><path d="M20 29V66M6 42H34" /></g></svg>
      <span style={line} />
    </div>
  );
}
