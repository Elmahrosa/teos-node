export default function NotFound() {
  return (
    <main dir="rtl" lang="ar" className="min-h-screen flex items-center justify-center bg-black p-6 text-white">
      <section className="w-full max-w-xl text-center">
        <h1 className="text-3xl font-bold">الهوية السيادية الرقمية غير مسجلة</h1>
        <p className="mt-4 text-gray-300">لا توجد بيانات تسجيل لهذه الهوية في TEOS Registry.</p>
        <a href="/" className="inline-block mt-8 text-yellow-400">العودة إلى TEOS</a>
      </section>
    </main>
  );
}
