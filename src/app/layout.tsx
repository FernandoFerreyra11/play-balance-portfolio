import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PlayBalance | Domina tu tiempo",
  description: "Una aventura para aprender a equilibrar la tecnología y la vida real.",
};

import { Providers } from "@/components/providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <Providers>
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
