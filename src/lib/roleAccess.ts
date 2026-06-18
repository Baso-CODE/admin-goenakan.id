export const ROLE_ACCESS_MAP: Record<string, string[]> = {
  SUPER_ADMIN: [
    "/dashboard",
    "/super-admin",
    "/admin-invoice",
    "/admin-article",
  ],
  ADMIN_INVOICE: ["/dashboard", "/admin-invoice"],
  ADMIN_ARTICLE: ["/dashboard", "/admin-article"],
  STAFF_GUDANG: ["/dashboard", "/super-admin/logistics"],
};

// Fungsi pembantu untuk mengecek apakah role boleh mengakses path tertentu
export function checkAccess(roleName: string, currentPath: string): boolean {
  const allowedPaths = ROLE_ACCESS_MAP[roleName] || [];

  return allowedPaths.some((allowedPath) =>
    currentPath.startsWith(allowedPath),
  );
}
