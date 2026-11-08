import fs from "fs";
import path from "path";
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
          <h1 className="text-3xl font-bold">نطاق محجوز</h1>
          <p className="mt-4">{domain}.teos</p>
          <p className="mt-3">هذا النطاق محجوز وغير متاح للبيع أو التسجيل.</p>
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

  return (
    <main dir="rtl" lang="ar" className="min-h-screen flex items-center justify-center p-6">
      <section className="w-full max-w-xl rounded-2xl border border-yellow-700/40 bg-black/40 p-8 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={crestSrc}
          alt={`${domain.toUpperCase()}.TEOS`}
          className="mx-auto mb-6 w-full max-w-md rounded-xl object-contain"
        />
        <p className="text-sm text-yellow-400">TEOS SOVEREIGN IDENTITY</p>
        <h1 className="mt-4 break-all text-4xl font-bold" style={{ fontFamily: "Cinzel, Georgia, serif" }}>
          {domain.toUpperCase()}.TEOS
        </h1>

        <div className="mt-8 space-y-5 text-right">
          <div>
            <p className="text-sm text-yellow-400">حالة السجل</p>
            <p className="mt-1">مسجل في Registry</p>
          </div>
          <div>
            <p className="text-sm text-yellow-400">النطاق</p>
            <p className="mt-1">{displayValue(domain)}.teos</p>
          </div>
          <div>
            <p className="text-sm text-yellow-400">عنوان المحفظة المسجل</p>
            <p dir="ltr" className="mt-1 text-left break-all">{shortWallet(claim.owner)}</p>
          </div>
          <div>
            <p className="text-sm text-yellow-400">تاريخ التسجيل</p>
            <p dir="ltr" className="mt-1 text-left">{claimedAt ?? "لا توجد بيانات"}</p>
          </div>
          <div>
            <p className="text-sm text-yellow-400">توقيع معاملة التسجيل</p>
            <p dir="ltr" className="mt-1 text-left break-all">{displayValue(claim.tx)}</p>
          </div>
          <div>
            <p className="text-sm text-yellow-400">التحقق من ملكية NFT</p>
            <p className="mt-1">غير متحقق منها — يلزم فحص Metaplex Core على الشبكة.</p>
          </div>
        </div>

        <a href="/" className="inline-block mt-8 text-yellow-400">العودة إلى TEOS</a>
      </section>
    </main>
  );
}