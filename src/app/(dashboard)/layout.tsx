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
  // 1. Dapatkan role dari session (dari backend/database)
  const userRole = session.user.role as string;

  // 2. Dapatkan URL (pathname) saat ini
  const headersList = headers();
  const currentPath = headersList.get("x-invoke-path") || "/dashboard";

  // 3. Cek akses menggunakan fungsi yang kita buat
  const hasAccess = checkAccess(userRole, currentPath);

  if (!hasAccess) {
    // Jika tidak punya akses, lempar ke halaman unauthorized atau dashboard utama
    return redirect("/dashboard?error=unauthorized");
  }

  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
