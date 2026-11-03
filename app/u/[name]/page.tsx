import CloneGate from '@/components/CloneGate';

export default function Page({ params }: { params: { name: string } }) {
  const domain = params.name;
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <CloneGate domain={domain} />
    </div>
  );
}