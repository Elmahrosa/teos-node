export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const name = (searchParams.get('name') || '').replace('.teos','').toLowerCase()
  const len = name.length
  let price = 10
  if (len === 4) price = 150
  if (len === 3) price = 400
  if (len <= 2) price = 0
  return Response.json({ name: name + '.teos', length: len, priceUSD: price })
}