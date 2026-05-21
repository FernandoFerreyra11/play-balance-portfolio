import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// En Next.js 16, la función debe llamarse 'proxy' y el archivo 'proxy.ts'
const authProxy = withAuth(
  function proxy(req) {
    const token = req.nextauth.token;
    const role = token?.role;
    const pathname = req.nextUrl.pathname;

    // 1. Proteger panel de administración de familia
    if (pathname.startsWith("/admin") && role !== "parent") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // 2. Proteger panel institucional
    if (pathname.startsWith("/institucion") && role !== "org_admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // 3. Proteger panel profesional
    if (pathname.startsWith("/pro") && role !== "professional") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // 4. Proteger panel super administrador
    if (pathname.startsWith("/super-admin") && role !== "super_admin") {
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
  matcher: [
    "/admin/:path*",
    "/institucion/:path*",
    "/pro/:path*",
    "/super-admin/:path*",
  ],
};

