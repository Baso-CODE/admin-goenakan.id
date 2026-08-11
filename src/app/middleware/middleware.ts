// /middleware.ts

import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const pathname = req.nextUrl.pathname;

  const isAuthenticated = !!token;
  const role = (token?.role || "") as string;

  if (!isAuthenticated) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Path root / hanya boleh diakses oleh SUPER_ADMIN atau dialihkan
  if (pathname === "/") {
    if (role === "ADMIN_INVOICE") {
      return NextResponse.redirect(new URL("/admin-invoice", req.url));
    }
    if (role === "ADMIN_ARTICLE") {
      return NextResponse.redirect(new URL("/admin-article", req.url));
    }
  }

  // Jika mencoba akses /admin-invoice/*
  if (
    pathname.startsWith("/admin-invoice") &&
    !(role === "ADMIN_INVOICE" || role === "SUPER_ADMIN")
  ) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Jika mencoba akses /admin-article/*
  if (
    pathname.startsWith("/admin-article") &&
    !(role === "ADMIN_ARTICLE" || role === "SUPER_ADMIN")
  ) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/admin-invoice/:path*",
    "/admin-article/:path*",
    "/super-admin/:path*",
  ],
};
