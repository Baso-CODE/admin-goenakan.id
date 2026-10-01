"use client";

import { ADMIN_ROUTES } from "@/config/adminRoutes";
import { canAccessAdminRoute, getDefaultAdminRoute } from "@/lib/adminAccess";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PermissionRouteGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    const role = session?.user?.role || "";
    const permissions = session?.user?.permissions || [];

    if (pathname === "/") {
      return;
    }

    if (pathname === "/unauthorized") {
      return;
    }

    const matchedRoute = [...ADMIN_ROUTES]
      .sort((a, b) => b.url.length - a.url.length)
      .find(
        (route) =>
          pathname === route.url || pathname.startsWith(`${route.url}/`),
      );

    if (!matchedRoute) {
      return;
    }

    const allowed = canAccessAdminRoute(matchedRoute, role, permissions);

    if (allowed) {
      return;
    }

    const fallback = getDefaultAdminRoute(role, permissions);

    if (fallback && fallback !== pathname && fallback !== "/unauthorized") {
      router.replace(fallback);
      return;
    }

    router.replace("/unauthorized");
  }, [
    pathname,
    router,
    session?.user?.permissions,
    session?.user?.role,
    status,
  ]);

  return children;
}
