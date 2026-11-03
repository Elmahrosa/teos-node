export default async function Page({ params }: { params: Promise<{ name: string }> }) {
  const domain = (await params).name;
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4" style={{ color: "#fff", textAlign: "center" }}>
      <div>
        <h1 style={{ fontFamily: "Cinzel, Georgia, serif" }}>{domain}</h1>
        <a href="/" style={{ color: "#eab308" }}>web4.elmahrosa.org</a>
      </div>
    </div>
  );
}