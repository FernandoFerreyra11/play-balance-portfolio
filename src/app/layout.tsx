import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PlayBalance | Domina tu tiempo",
  description: "Una aventura para aprender a equilibrar la tecnología y la vida real.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
