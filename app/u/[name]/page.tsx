export default async function SovereignProfile({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const clean = name.toLowerCase();
  return (
    <div style={{background:'black',color:'white',minHeight:'100vh',padding:'40px',fontFamily:'monospace'}}>
      <h1 style={{fontSize:'48px',color:'#facc15'}}>👑 {clean}</h1>
      <p style={{color:'#22c55e'}}>SOVEREIGN RESOLVED • LIVE from El Mahrosa - Site 022</p>
      <div style={{border:'1px solid #333',padding:'20px',marginTop:'30px',borderRadius:'12px'}}>
        <p>Domain: {clean}</p>
        <p>Root: .teos - Golden Root</p>
        <p>Owner: Metaplex Core - Solana Mainnet - Eternal - No Renewal</p>
        <p>Alexandria: Ayman Seif - From El Mahrosa</p>
        <p>Rule: 1 Key unlocks 125 Nations</p>
        <p style={{marginTop:'20px'}}>Gateway: <a style={{color:'#60a5fa'}} href={`/api/gateway/${clean}`}>/api/gateway/{clean}</a></p>
      </div>
      <p style={{marginTop:'40px',opacity:0.5}}>TEOS V15 - First sovereign profile page</p>
    </div>
  )
}