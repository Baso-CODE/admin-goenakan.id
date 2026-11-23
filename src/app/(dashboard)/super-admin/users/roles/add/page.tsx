"use client";

import { ArrowLeft, Loader2, Save, ShieldPlus } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useApi } from "@/hooks/useApi";

export default function AddRolePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { fetchApi, status } = useApi();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

  const normalizedName = name.trim().toUpperCase().replace(/\s+/g, "_");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (submitting) return;

    if (status !== "authenticated" || !isSuperAdmin) {
      toast.error("Hanya Super Admin yang dapat membuat role.");
      return;
    }

    if (!normalizedName || normalizedName.length > 50) {
      toast.error("Nama role wajib diisi, maksimal 50 karakter.");
      return;
    }

    if (description.length > 255) {
      toast.error("Deskripsi maksimal 255 karakter.");
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetchApi("/roles", {
        method: "POST",
        body: JSON.stringify({
          name: normalizedName,
          description: description.trim(),
        }),
      });

      const result = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(result?.message || "Gagal membuat role.");
      }

      toast.success("Role berhasil dibuat!");

      // Setelah role dibuat, Super Admin dapat
      // mengatur permissions untuk role tersebut.
      if (result?.id) {
        router.push(`/super-admin/users/roles/permissions/${result.id}`);
      } else {
        router.push("/super-admin/users/roles");
      }

      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat membuat role.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (status !== "authenticated" || !isSuperAdmin) {
    return (
      <div className="mx-auto  w-full py-10 text-center">
        <h1 className="text-xl font-semibold">Akses Ditolak</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Halaman ini hanya tersedia untuk Super Admin.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full space-y-6 py-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" asChild>
          <Link href="/super-admin/users/roles">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>

        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add New Role</h1>
          <p className="text-sm text-muted-foreground">
            Buat role baru untuk mengatur akses pengguna.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2 text-blue-600">
              <ShieldPlus className="h-6 w-6" />
            </div>

            <div>
              <CardTitle>Role Information</CardTitle>
              <CardDescription>
                Lengkapi informasi role yang ingin dibuat.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="role-name">
                Role Name <span className="text-red-500">*</span>
              </Label>

              <Input
                id="role-name"
                placeholder="Contoh: ADMIN_SALES"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
                disabled={submitting}
                required
              />

              {normalizedName && (
                <p className="text-xs text-muted-foreground">
                  Akan disimpan sebagai:{" "}
                  <span className="font-mono font-semibold">
                    {normalizedName}
                  </span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role-description">Description</Label>

              <Textarea
                id="role-description"
                placeholder="Contoh: Admin Sales yang mengelola quotation dan invoice."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={255}
                rows={4}
                disabled={submitting}
              />
            </div>

            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-sm font-medium">Pengaturan Hak Akses</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Setelah role berhasil dibuat, kamu akan diarahkan ke halaman
                Permissions untuk menentukan fitur yang boleh diakses.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                asChild>
                <Link href="/super-admin/users/roles">Cancel</Link>
              </Button>

              <Button
                type="submit"
                disabled={submitting || !normalizedName}
                className="bg-blue-600 hover:bg-blue-700">
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}

                {submitting ? "Saving..." : "Create Role"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
