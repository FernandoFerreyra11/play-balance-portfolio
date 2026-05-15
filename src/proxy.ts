import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// En Next.js 16, la función debe llamarse 'proxy' y el archivo 'proxy.ts'
const authProxy = withAuth(
  function proxy(req) {
    const token = req.nextauth.token;
    const isParent = token?.role === "parent";
    
    // Si intenta acceder a /admin y no es padre, redirigir al inicio
    if (req.nextUrl.pathname.startsWith("/admin") && !isParent) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const proxy = authProxy;

export const config = {
  matcher: ["/admin/:path*"], // Ya no protegemos la raíz para permitir ver la Landing Page
};
