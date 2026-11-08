import OptImg from "./OptImg";

const SERIF = "Cinzel, Georgia, 'Times New Roman', serif";
const LIST: { name: string; href?: string }[] = [
  { name: "TEOS Sentinel Shield" },
  { name: "UnityCare" },
  { name: "TEOS DealMaker" },
  { name: "@teoslinker_bot", href: "https://t.me/teoslinker_bot" },
];

// See Our Products. The lion seal is an uploaded asset: drop it at public/images/lion-seal.png.
export default function Products() {
  return (
    <section id="products" aria-labelledby="prod" style={{ margin: "36px 0 8px", padding: 22, border: "1px solid #3d352a", borderRadius: 6, background: "#17130f", textAlign: "center" }}>
      <OptImg src="/images/lion-seal.png" alt="ELMAHROSA INTERNATIONAL" style={{ width: 120, height: 120, objectFit: "contain", display: "block", margin: "0 auto 10px" }} />
      <h2 id="prod" dir="ltr" style={{ fontFamily: SERIF, fontWeight: 400, letterSpacing: "0.1em", color: "#f1e7cf", margin: "0 0 4px" }}>ELMAHROSA INTERNATIONAL</h2>
      <p dir="ltr" style={{ margin: "0 0 16px", color: "#a89a80", fontSize: 13 }}>See Our Products</p>
      <ul dir="ltr" style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
        {LIST.map((p) => (
          <li key={p.name} style={{ border: "1px solid #57493a", background: "#292321", borderRadius: 4, padding: "10px 16px", fontSize: 14, fontWeight: 700 }}>
            {p.href ? <a href={p.href} target="_blank" rel="noopener noreferrer" style={{ color: "#d9c48a", textDecoration: "none" }}>{p.name}</a> : <span style={{ color: "#fef3c7" }}>{p.name}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}
