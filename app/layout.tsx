export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{background:"white",color:"black",margin:0}}>{children}</body>
    </html>
  );
}
