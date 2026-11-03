export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const name = (searchParams.get('name') || '').replace('.teos','').toLowerCase()
  const len = name.length
  let price = 10
  if (len === 4) price = 150
  if (len === 3) price = 400
  if (len <= 2) price = 0 // محجوز للمؤسس

  return Response.json({
    name: name + '.teos',
    length: len,
    priceUSD: price,
    priceSOL: (price * 0.0109).toFixed(4),
    pay: {
      sol: 'Solana - Phantom / Solflare / Backpack',
      vodafone: '01006167293',
      paypal: 'elma7rosa@gmx.com'
    },
    whatsapp: `https://wa.me/201006167293?text=${encodeURIComponent('عايز احجز ' + name + '.teos بسعر ' + price + '$')}`
  })
}