import { authOptions } from "@/lib/authOptions";
import { getServerSession } from "next-auth";
import { cookies } from "next/headers";

export default async function SuperAdminDashboard() {
  const session = await getServerSession(authOptions);

  // 1. Dapatkan cookies()
  const cookieStore = cookies();

  // 2. Akses cookie sesi terenkripsi
  const encryptedSessionToken = (await cookieStore).get(
    "next-auth.session-token"
  );

  return (
    <div>
      <h1 className="text-2xl font-bold">Super Admin Dashboard</h1>
      {/* <p className="text-muted-foreground mt-2">
        Selamat datang {session?.user.name}! Role kamu: {session?.user.role}
      </p> */}
    </div>
  );
}
