import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PlayBalance | Domina tu tiempo",
  description: "Una aventura para aprender a equilibrar la tecnología y la vida real.",
};

import { Providers } from "@/components/providers";
import FeedbackWidget from "@/components/FeedbackWidget";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);
  const isParent = session?.user && (session.user as any).role === 'parent';

  return (
    <html lang="es">
      <body>
        <Providers>
          <main>{children}</main>
          {isParent && <FeedbackWidget />}
        </Providers>
      </body>
    </html>
  );
}
