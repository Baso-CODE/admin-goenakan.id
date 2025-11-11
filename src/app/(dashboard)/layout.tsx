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

  if (!session || !session.user) {
    return redirect("/login");
  }

  const userRole = session.user.role;

  if (!ALLOWED_DASHBOARD_ROLES.includes(userRole as string)) {
    return redirect("/");
  }

  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
