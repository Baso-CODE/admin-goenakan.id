import { authOptions } from "@/lib/authOptions";
import { checkPermission } from "@/lib/roleAccess";
import { getServerSession } from "next-auth";
import { headers } from "next/headers";
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

  const userPermissions = (session.user as any)?.permissions || [];

  const headersList = await headers();
  const currentPath = headersList.get("x-invoke-path") || "/dashboard";

  if (currentPath === "/dashboard") {
    return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
  }

  //  OTOMATIS ALGORITMIK: Menerjemahkan URL secara dinamis tanpa hardcode
  const inferredPermission = getPermissionFromUrlDynamically(currentPath);

  if (inferredPermission) {
    const hasAccess = checkPermission(userPermissions, inferredPermission);

    if (!hasAccess) {
      return redirect("/dashboard?error=unauthorized");
    }
  }

  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}

//  HELPER DINAMIS: Mengubah URL apa saja menjadi format permission secara otomatis
function getPermissionFromUrlDynamically(url: string): string | null {
  // 1. Pecah URL berdasarkan garis miring (/), lalu ambil segmen yang valid
  const segments = url.split("/").filter(Boolean);

  // Contoh: Jika URL-nya "/super-admin/purchase-orders", segmennya adalah ["super-admin", "purchase-orders"]
  // Kita biasanya ingin mengambil kata kunci utamanya (misal segmen terakhir atau setelah prefix admin)

  if (segments.length === 0) return null;

  // Abaikan segmen awalan yang bersifat umum seperti "super-admin", "admin", "dashboard"
  const filteredSegments = segments.filter(
    (seg) =>
      ![
        "super-admin",
        "admin",
        "dashboard",
        "admin-invoice",
        "admin-article",
      ].includes(seg),
  );

  if (filteredSegments.length === 0) return null;

  // Ambil kata kunci utama (misal: "purchase-orders")
  let rawModule = filteredSegments[0];

  // 2. Ubah tanda hubung (-) menjadi underscore (_), dan hilangkan huruf 's' di akhir jika ada (bentuk plural ke singular)
  // Contoh: "purchase-orders" -> "purchase_order", "users" -> "user"
  let cleanModule = rawModule.replace(/-/g, "_");
  if (cleanModule.endsWith("s")) {
    cleanModule = cleanModule.slice(0, -1);
  }

  // 3. Gabungkan dengan awalan 'read_' standar
  return `read_${cleanModule}`;
}
