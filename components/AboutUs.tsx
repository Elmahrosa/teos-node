import OptImg from "./OptImg";

const SERIF = "Cinzel, Georgia, 'Times New Roman', serif";

// Deep Flashback - About Us. Founder-written copy. Photo (founder in front of a globe) is an uploaded asset: public/founder/ayman-globe.jpg.
export default function AboutUs() {
  const p: React.CSSProperties = { margin: "0 0 12px" };
  return (
    <section aria-labelledby="about" style={{ margin: "40px 0 8px", padding: "28px 22px", border: "1px solid #3d352a", borderRadius: 6, background: "#17130f", textAlign: "center", lineHeight: 1.7, color: "#d6cbb5", fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif" }}>
      <h2 id="about" dir="ltr" style={{ fontFamily: SERIF, fontWeight: 400, letterSpacing: "0.1em", color: "#f1e7cf", margin: "0 0 18px" }}>Deep Flashback - About Us</h2>
      <OptImg src="/founder/ayman-globe.jpg" alt="Ayman Seif in front of a globe" style={{ display: "block", margin: "0 auto 18px", maxWidth: "min(100%, 560px)", maxHeight: 340, width: "auto", height: "auto", borderRadius: 6, border: "1px solid #8a7335" }} />
      <div dir="ltr" style={{ maxWidth: 640, margin: "0 auto" }}>
        <p style={p}>El Mahrosa started in Alexandria, Egypt.</p>
        <p style={{ ...p, color: "#f1e7cf", fontWeight: 700 }}>Not as a project. As a family.</p>
        <p style={p}>We wanted to own our names.</p>
        <p style={p}>In Web3, your name is your identity, your wallet, your history.</p>
        <p style={p}>So we built El Mahrosa .TEOS - where you own your domain forever.</p>
        <p style={{ ...p, color: "#d9c48a", fontWeight: 700, margin: 0 }}>From Alexandria to the World.</p>
      </div>
    </section>
  );
}
