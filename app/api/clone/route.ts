import { NextResponse } from 'next/server';
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  let from = searchParams.get('from') || '';
  const to = searchParams.get('to') || 'my.teos';
  if (!from) return NextResponse.json({ error: 'Missing from' }, { status: 400 });
  if (!from.startsWith('http')) from = 'https://' + from;
  try {
    const res = await fetch(from, { headers: { 'User-Agent': 'TEOS-Cloner/1.0' } });
    let html = await res.text();
    const base = new URL(from).origin;
    html = html.replace(/(src|href|action)=\"\/(?!\/)/g, '=\"' + base + '/');
    return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'X-TEOS-Cloned-From': from, 'X-TEOS-To': to } });
  } catch (e: any) {
    return NextResponse.json({ error: 'Clone failed', details: String(e?.message || e) }, { status: 500 });
  }
}
