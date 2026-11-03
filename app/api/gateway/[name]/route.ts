import { NextResponse } from 'next/server'

export async function GET(request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params
  const clean = name.toLowerCase()
  return NextResponse.json({
    sovereign: clean,
    tld: ".teos",
    status: "SOVEREIGN_RESOLVED",
    gateway: `web4.elmahrosa.org/u/${clean}`,
    live: true,
    timestamp: new Date().toISOString(),
    site: "El Mahrosa - Alexandria Site 022"
  })
}