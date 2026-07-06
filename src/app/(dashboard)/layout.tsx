import { authOptions } from "@/lib/authOptions";
import { checkAccess } from "@/lib/roleAccess";
import { getServerSession } from "next-auth";
import { headers } from "next/headers"; // Untuk mendapatkan URL saat ini
import { redirect } from "next/navigation";
import DashboardLayoutClient from "./DashboardLayoutClient";

export default async function DashboardGuardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return redirect("/login");
  }

  const isExpired = new Date(session.expires) < new Date();
  if (isExpired) {
    return redirect("/login");
  }

  // === PENGECEKAN DINAMIS ===

  const userRole = session.user.role as string;

  // 2. Dapatkan URL (pathname) saat ini
  const headersList = await headers();
  const currentPath = headersList.get("x-invoke-path") || "/dashboard";

  const hasAccess = checkAccess(userRole, currentPath);

  if (!hasAccess) {
    return redirect("/dashboard?error=unauthorized");
  }

  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
