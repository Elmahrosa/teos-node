import { NextResponse } from "next/server";
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "my.teos";
  if (!from) return NextResponse.json({ error: "حط لينك موقعك القديم" }, { status: 400 });
  try {
    const res = await fetch(from, { headers: { "User-Agent": "TEOS-Cloner/1.0" } });
    const html = await res.text();
    // بنرجع نسخة بسيطة دلوقتي + بنسجل الطلب
    return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8", "X-TEOS-Cloned-From": from, "X-TEOS-To": to } });
  } catch (e: any) {
    return NextResponse.json({ error: "مش قادرين نوصل للموقع ده، اتأكد ان اللينك صح", details: String(e?.message || e) }, { status: 500 });
  }
}
