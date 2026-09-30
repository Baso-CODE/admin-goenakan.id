import { ADMIN_ROUTES, AdminRoute } from "@/config/adminRoutes";

export function canAccessAdminRoute(
  route: AdminRoute,
  role: string,
  permissions: string[],
): boolean {
  if (role === "SUPER_ADMIN") {
    return true;
  }

  if (route.superAdminOnly) {
    return false;
  }

  if (!route.permission) {
    return false;
  }

  return permissions.includes(route.permission);
}

export function getDefaultAdminRoute(
  role: string,
  permissions: string[],
): string {
  if (role === "SUPER_ADMIN") {
    return "/super-admin";
  }

  const allowedRoutes = ADMIN_ROUTES.filter((route) =>
    canAccessAdminRoute(route, role, permissions),
  )
    .filter((route) => route.defaultPriority !== undefined)
    .sort((a, b) => (a.defaultPriority ?? 9999) - (b.defaultPriority ?? 9999));

  return allowedRoutes[0]?.url ?? "/unauthorized";
}

export function getAccessibleAdminRoutes(
  role: string,
  permissions: string[],
): AdminRoute[] {
  return ADMIN_ROUTES.filter((route) =>
    canAccessAdminRoute(route, role, permissions),
  );
}
