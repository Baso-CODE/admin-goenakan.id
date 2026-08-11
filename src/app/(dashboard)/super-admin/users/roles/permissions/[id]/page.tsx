"use client";

import {
  ArrowLeft,
  CheckSquare,
  Save,
  ShieldCheck,
  Square,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/hooks/useApi";
import Link from "next/link";

// === TYPES ===
type Permission = {
  id: string;
  name: string;
  description?: string;
};

export default function RolePermissionsPage() {
  const params = useParams();
  const router = useRouter();
  const roleId = params.id as string;

  const { fetchApi } = useApi();

  // === STATE ===
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [roleName, setRoleName] = useState("");

  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  // === FETCH DATA ===
  const fetchData = async () => {
    setLoading(true);
    try {
      const resRole = await fetchApi(`/roles/${roleId}`);
      if (!resRole.ok) throw new Error("Gagal memuat data role");
      const roleData = await resRole.json();
      setRoleName(roleData.name);

      const resRolePerms = await fetchApi(`/roles/${roleId}/permissions`);
      if (!resRolePerms.ok) throw new Error("Gagal memuat permissions role");
      const rolePermsData = await resRolePerms.json();

      const assignedIds = (rolePermsData.data || []).map(
        (p: Permission) => p.id,
      );
      setSelectedPermissions(assignedIds);

      const resAllPerms = await fetchApi(`/roles/permissions/all`);
      if (!resAllPerms.ok)
        throw new Error("Gagal memuat daftar seluruh permissions");
      const allPermsData = await resAllPerms.json();
      setAllPermissions(allPermsData.data || allPermsData || []);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Terjadi kesalahan saat memuat data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (roleId) {
      fetchData();
    }
  }, [roleId]);

  // === HANDLER CHECKBOX CHANGE ===
  const handleCheckboxChange = (permissionId: string) => {
    setSelectedPermissions((prev) => {
      if (prev.includes(permissionId)) {
        return prev.filter((id) => id !== permissionId);
      } else {
        return [...prev, permissionId];
      }
    });
  };

  // === HANDLER SELECT ALL PER MODULE ===
  const handleSelectAllModule = (modulePermissions: Permission[]) => {
    const modulePermIds = modulePermissions.map((p) => p.id);
    const isAllSelected = modulePermIds.every((id) =>
      selectedPermissions.includes(id),
    );

    if (isAllSelected) {
      // Jika semua sudah dicentang, maka batalkan centang untuk modul ini
      setSelectedPermissions((prev) =>
        prev.filter((id) => !modulePermIds.includes(id)),
      );
    } else {
      // Jika belum, tambahkan semua ID permission modul ini
      setSelectedPermissions((prev) => {
        const combined = [...prev, ...modulePermIds];
        return Array.from(new Set(combined)); // Hilangkan duplikat
      });
    }
  };

  // === GROUPING PERMISSIONS BY MODULE ===
  // Mengelompokkan berdasarkan kata setelah underscore pertama (contoh: read_product -> modul: product)
  const groupedPermissions = allPermissions.reduce(
    (acc, perm) => {
      const parts = perm.name.split("_");
      const moduleName = parts.slice(1).join("_") || "general"; // Mengambil nama modul di belakang

      if (!acc[moduleName]) {
        acc[moduleName] = [];
      }
      acc[moduleName].push(perm);
      return acc;
    },
    {} as Record<string, Permission[]>,
  );

  // === HANDLER SUBMIT ===
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetchApi(`/roles/${roleId}/permissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          permissionIds: selectedPermissions,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Gagal menyimpan permissions");
      }

      toast.success("Hak akses (permissions) berhasil diperbarui!");
      router.push("/super-admin/users/roles");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 w-full mx-auto pb-10">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full mx-auto pb-10">
      <div className="flex items-center justify-between">
        <Link href="/super-admin/users/roles">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Button>
        </Link>
      </div>

      <Card className="border-l-4 border-l-blue-600 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShieldCheck className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">
                Atur Hak Akses:{" "}
                <span className="text-blue-600">{roleName}</span>
              </CardTitle>
              <CardDescription>
                Pilih dan centang modul atau fitur berdasarkan kelompok kategori
                di bawah ini.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Render Kartu Per Kelompok Modul */}
        {Object.entries(groupedPermissions).map(([moduleName, permissions]) => {
          const modulePermIds = permissions.map((p) => p.id);
          const isAllModuleSelected = modulePermIds.every((id) =>
            selectedPermissions.includes(id),
          );

          return (
            <Card key={moduleName} className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between py-4 bg-muted/20 border-b">
                <div className="space-y-0.5">
                  <CardTitle className="text-lg capitalize font-semibold text-gray-800">
                    Modul: {moduleName.replace(/_/g, " ")}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Kelola hak akses untuk {moduleName.replace(/_/g, " ")}
                  </CardDescription>
                </div>
                {/* Tombol Pilih Semua per Modul */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectAllModule(permissions)}
                  className="text-xs gap-1.5 h-8">
                  {isAllModuleSelected ? (
                    <>
                      <CheckSquare className="h-3.5 w-3.5 text-blue-600" />{" "}
                      Batalkan Semua
                    </>
                  ) : (
                    <>
                      <Square className="h-3.5 w-3.5" /> Pilih Semua
                    </>
                  )}
                </Button>
              </CardHeader>

              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {permissions.map((perm) => {
                    const isChecked = selectedPermissions.includes(perm.id);
                    return (
                      <div
                        key={perm.id}
                        className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                          isChecked
                            ? "bg-blue-50/50 border-blue-200"
                            : "hover:bg-muted/30"
                        }`}>
                        <Checkbox
                          id={perm.id}
                          checked={isChecked}
                          onCheckedChange={() => handleCheckboxChange(perm.id)}
                          className="mt-1"
                        />
                        <div
                          className="space-y-1 leading-none cursor-pointer"
                          onClick={() => handleCheckboxChange(perm.id)}>
                          <label
                            htmlFor={perm.id}
                            className="text-sm font-medium text-gray-800 cursor-pointer capitalize">
                            {perm.name.replace(/_/g, " ")}
                          </label>
                          {perm.description && (
                            <p className="text-xs text-muted-foreground">
                              {perm.description}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Tombol Aksi Global */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Link href="/super-admin/roles">
            <Button variant="outline" type="button">
              Batal
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 hover:bg-blue-700 gap-2">
            <Save className="h-4 w-4" />
            {submitting ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </div>
      </form>
    </div>
  );
}
