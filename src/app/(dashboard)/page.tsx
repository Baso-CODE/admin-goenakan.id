import { getDefaultAdminRoute } from "@/lib/adminAccess";
import { authOptions } from "@/lib/authOptions";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function DashboardEntryPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role ?? "";
  const permissions = session.user.permissions ?? [];

  redirect(getDefaultAdminRoute(role, permissions));
}
