import { ADMIN_ROUTES } from "@/config/adminRoutes";
import { canAccessAdminRoute, getDefaultAdminRoute } from "@/lib/adminAccess";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const pathname = req.nextUrl.pathname;

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const role = typeof token.role === "string" ? token.role : "";

  const permissions: string[] = Array.isArray(token.permissions)
    ? token.permissions.filter(
        (permission): permission is string => typeof permission === "string",
      )
    : [];

  if (pathname === "/") {
    const destination = getDefaultAdminRoute(role, permissions);

    return NextResponse.redirect(new URL(destination, req.url));
  }

  const matchedRoute = [...ADMIN_ROUTES]
    .sort((a, b) => b.url.length - a.url.length)
    .find((route) => {
      return pathname === route.url || pathname.startsWith(`${route.url}/`);
    });

  if (!matchedRoute) {
    if (role === "SUPER_ADMIN") {
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  const hasAccess = canAccessAdminRoute(matchedRoute, role, permissions);

  if (!hasAccess) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
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
