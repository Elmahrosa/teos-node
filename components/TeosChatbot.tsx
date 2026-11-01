"use client";
import { useEffect, useRef, useState } from "react";
import type { Dict } from "../lib/i18n";

type Msg = { role: "user" | "assistant"; content: string };

// Floating chat bubble (bottom left; the Ayman button stays bottom right). Talks to /api/chat.
export default function TeosChatbot({ t, rtl }: { t: Dict; rtl: boolean }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [messages, loading, open]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: next.slice(-8) }) });
      const data = await res.json().catch(() => ({}));
      setMessages([...next, { role: "assistant", content: res.ok && data.reply ? data.reply : t.chatError }]);
    } catch {
      setMessages([...next, { role: "assistant", content: t.chatError }]);
    }
    setLoading(false);
  }

  const shown: Msg[] = [{ role: "assistant", content: t.chatHello }, ...messages];
  const side = { insetInlineStart: 20 };
  return (
    <div dir={rtl ? "rtl" : "ltr"} style={{ position: "fixed", bottom: 20, zIndex: 9999, ...side }}>
      {!open && (
        <button onClick={() => setOpen(true)} aria-label={t.chatOpen} title={t.chatOpen} style={{ width: 56, height: 56, borderRadius: "50%", background: "#8B5A2B", border: "2px solid #1F3B44", color: "#fff", fontSize: 26, cursor: "pointer", boxShadow: "0 6px 20px rgba(0,0,0,.6)" }}>💬</button>
      )}
      {open && (
        <div role="dialog" aria-label={t.chatTitle} style={{ width: "min(350px, calc(100vw - 40px))", height: "min(450px, calc(100vh - 120px))", background: "#F8F6F0", color: "#2a2520", border: "2px solid #1F3B44", borderRadius: 20, display: "flex", flexDirection: "column", boxShadow: "0 12px 40px rgba(0,0,0,.7)", overflow: "hidden" }}>
          <div style={{ background: "#1F3B44", color: "#fff", padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <strong style={{ fontSize: 14 }}>{t.chatTitle}</strong>
            <button onClick={() => setOpen(false)} aria-label={t.chatClose} style={{ background: "none", border: 0, color: "#fff", fontSize: 20, cursor: "pointer" }}>×</button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 8, fontSize: 14 }}>
            {shown.map((m, i) => (
              <div key={i} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "85%", background: m.role === "user" ? "#1F3B44" : "#fff", color: m.role === "user" ? "#fff" : "#2a2520", border: m.role === "user" ? 0 : "1px solid #d4c5a9", padding: "8px 12px", borderRadius: 12, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{m.content}</div>
            ))}
            {loading && <div style={{ fontSize: 12, opacity: 0.6 }}>{t.chatTyping}</div>}
            <div ref={end} />
          </div>
          <div style={{ padding: 8, borderTop: "1px solid #d4c5a9", display: "flex", gap: 8 }}>
            <input value={input} maxLength={500} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder={t.chatPlaceholder} style={{ flex: 1, minWidth: 0, padding: "8px 12px", borderRadius: 999, border: "1px solid #8a7550", fontSize: 14, outline: "none" }} />
            <button onClick={send} disabled={loading} style={{ background: "#8B5A2B", color: "#fff", border: 0, padding: "8px 16px", borderRadius: 999, fontWeight: 700, cursor: "pointer" }}>{t.chatSend}</button>
          </div>
        </div>
      )}
    </div>
  );
}
