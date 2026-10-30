import { QueryProvider } from "@/components/providers/ query-provider";
import { authOptions } from "@/lib/authOptions";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import DashboardLayoutClient from "./DashboardLayoutClient";
import PermissionRouteGuard from "./components/permissionRouteGuard";

export default async function DashboardGuardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const isExpired = new Date(session.expires) < new Date();

  if (isExpired) {
    redirect("/login");
  }

  return (
    <PermissionRouteGuard>
      <DashboardLayoutClient>
        <QueryProvider>{children}</QueryProvider>
      </DashboardLayoutClient>
    </PermissionRouteGuard>
  );
}
