export default async function SovereignProfile({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const clean = name.toLowerCase();
  
  return (
    <div style={{background:'black', color:'white', minHeight:'100vh', padding:'40px', fontFamily:'monospace'}}>
      <h1 style={{fontSize:'48px', color:'#facc15'}}>👑 {clean}</h1>
      <p style={{color:'#22c55e'}}>SOVEREIGN RESOLVED • LIVE from El Mahrosa</p>
      <div style={{border:'1px solid #333', padding:'20px', marginTop:'30px', borderRadius:'12px'}}>
        <p>Domain: {clean}</p>
        <p>Root: .teos - Golden Root</p>
        <p>Owner: Metaplex Core - Solana Mainnet - Eternal</p>
        <p>Alexandria: Site 022 - Ayman Seif</p>
        <p>Rule: 1 Key unlocks 125 Nations</p>
        <p style={{marginTop:'20px'}}>
          Gateway: <a style={{color:'#60a5fa'}} href={`/api/gateway/${clean}`}>/api/gateway/{clean}</a>
        </p>
      </div>
      <p style={{marginTop:'40px', opacity:0.5}}>TEOS Sovereign Browser • V15 - First sovereign profile page in history</p>
    </div>
  )
}