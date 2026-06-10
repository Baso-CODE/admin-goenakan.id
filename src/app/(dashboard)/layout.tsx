import { authOptions } from "@/lib/authOptions";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import DashboardLayoutClient from "./DashboardLayoutClient";

const ALLOWED_DASHBOARD_ROLES = [
  "SUPER_ADMIN",
  "ADMIN_INVOICE",
  "ADMIN_ARTICLE",
];

export default async function DashboardGuardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // 1. Cek keberadaan sesi
  if (!session || !session.user) {
    return redirect("/login");
  }

  // 2. CEK KEDALUWARSA TOKEN
  // Kita mengambil 'exp' dari token.
  // Jika callback jwt kamu menyimpan 'exp', kita bisa memanfaatkannya.
  // Namun, getServerSession kadang tidak mengembalikan 'exp'.
  // Solusi aman: Cek apakah session.expires sudah lewat.
  const isExpired = new Date(session.expires) < new Date();

  if (isExpired) {
    return redirect("/login");
  }

  // 3. Cek Role
  const userRole = session.user.role;
  if (!ALLOWED_DASHBOARD_ROLES.includes(userRole as string)) {
    return redirect("/");
  }

  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
