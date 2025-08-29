import "./globals.css";

export const metadata = {
  title: "SpecHub Dashboard",
  description: "Frontend for spec management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans bg-gray-50 text-gray-900">
        <div className="max-w-3xl mx-auto">{children}</div>
      </body>
    </html>
  );
}
