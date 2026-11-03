import CloneGate from '@/components/CloneGate';

export default async function Page({ params }: { params: Promise<{ name: string }> }) {
  const domain = (await params).name;
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <CloneGate domain={domain} />
    </div>
  );
}