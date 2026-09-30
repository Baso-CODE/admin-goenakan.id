import { ShieldAlert } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <ShieldAlert className="h-8 w-8 text-muted-foreground" />
        </div>

        <h1 className="text-3xl font-bold tracking-tight">Akses Ditolak</h1>

        <p className="mt-3 text-sm text-muted-foreground">
          Akun Anda tidak memiliki permission untuk mengakses halaman ini.
        </p>

        <div className="mt-8 flex justify-center">
          <Button asChild>
            <Link href="/">Kembali ke Dashboard</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
