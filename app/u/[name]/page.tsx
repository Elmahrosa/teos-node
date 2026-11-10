import fs from "fs";
import path from "path";
import CrestImage from "../../../components/CrestImage";
import { notFound } from "next/navigation";
import { getClaim } from "../../../lib/registry";
import { isNotForSaleDomain } from "../../../lib/domain-rules";

function displayValue(value: string | null | undefined): string {
  return value?.trim() || "لا توجد بيانات";
}

function shortWallet(value: string | null | undefined): string {
  if (!value?.trim()) return "لا توجد بيانات";
  const wallet = value.trim();
  return wallet.length <= 12 ? wallet : `${wallet.slice(0, 6)}...${wallet.slice(-6)}`;
}

export default async function Page({ params }: { params: Promise<{ name: string }> }) {
  const rawName = (await params).name;
  const domain = rawName.trim().toLowerCase().replace(/\.teos$/, "");

  if (isNotForSaleDomain(domain)) {
    return (
      <main dir="rtl" lang="ar" className="min-h-screen flex items-center justify-center p-6">
        <section className="w-full max-w-xl text-center">
          <h1 className="text-3xl font-bold">هوية سيادية رقمية محجوزة</h1>
          <p className="mt-4">{domain}.teos</p>
          <p className="mt-3">هذه الهوية محجوزة وغير متاح للبيع أو التسجيل.</p>
          <a href="/" className="inline-block mt-8 text-yellow-400">العودة إلى TEOS</a>
        </section>
      </main>
    );
  }

  const claim = await getClaim(domain);
  if (!claim) notFound();

  const claimedAt =
    Number.isFinite(claim.at) && claim.at > 0
      ? new Date(claim.at).toISOString()
      : null;

  const crestFile = ["jpg", "png"]
    .map((ext) => `${domain}.teos.${ext}`)
    .find((f) => /^[a-z0-9-]+\.teos\.(jpg|png)$/.test(f) && fs.existsSync(path.join(process.cwd(), "public", "crests", f)));
  const crestSrc = crestFile ? `/crests/${crestFile}` : "/genesis-seal.png";

  const rows: { label: string; value: string; mono?: boolean }[] = [
    { label: "حالة السجل", value: "مسجل في Registry" },
    { label: "الهوية السيادية الرقمية", value: `${displayValue(domain)}.teos`, mono: true },
    { label: "عنوان المحفظة المسجل", value: shortWallet(claim.owner), mono: true },
    { label: "تاريخ التسجيل", value: claimedAt ?? "لا توجد بيانات", mono: true },
    { label: "توقيع معاملة التسجيل", value: displayValue(claim.tx), mono: true },
    { label: "التحقق من ملكية NFT", value: "غير متحقق منها — يلزم فحص Metaplex Core على الشبكة." },
  ];

  const gold = "#facc15";
  return (
    <main
      dir="ltr"
      style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: 24, background: "#0b0b0b", color: "#f5f5f5" }}
    >
      <section
        style={{ width: "100%", maxWidth: 560, boxSizing: "border-box", padding: 32, textAlign: "center", border: "1px solid rgba(180,130,30,0.4)", borderRadius: 16, background: "rgba(0,0,0,0.4)" }}
      >
        <p style={{ margin: 0, fontSize: 13, letterSpacing: 2, color: gold }}>TEOS SOVEREIGN IDENTITY</p>
        <h1 style={{ margin: "12px 0 0", fontSize: 36, fontWeight: 700, wordBreak: "break-all", fontFamily: "Cinzel, Georgia, serif" }}>
          {domain.toUpperCase()}.TEOS
        </h1>

        <CrestImage src={crestSrc} alt={`${domain.toUpperCase()}.TEOS`} />

        <dl style={{ margin: "32px 0 0", padding: 0 }}>
          {rows.map((r) => (
            <div key={r.label} style={{ padding: "12px 0", borderTop: "1px solid rgba(180,130,30,0.2)" }}>
              <dt dir="rtl" lang="ar" style={{ fontSize: 13, color: gold }}>{r.label}</dt>
              <dd dir={r.mono ? "ltr" : "rtl"} lang={r.mono ? undefined : "ar"} style={{ margin: "4px 0 0", wordBreak: "break-all" }}>{r.value}</dd>
            </div>
          ))}
        </dl>

        <a href="/" dir="rtl" lang="ar" style={{ display: "inline-block", marginTop: 24, color: gold }}>العودة إلى TEOS</a>
      </section>
    </main>
  );
}
