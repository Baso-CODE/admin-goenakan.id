"use client";

import {
  ArrowLeft,
  Check,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Eye,
  Pencil,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Square,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PERMISSION_GROUPS } from "@/config/permissionGroups";
import { useApi } from "@/hooks/useApi";

type Permission = {
  id: string;
  name: string;
  description?: string;
};

type PermissionModule = {
  module: string;
  label: string;
  permissions: Permission[];
};

type PermissionSection = {
  title: string;
  description: string;
  modules: PermissionModule[];
};

const ACTION_ORDER = ["read", "create", "update", "delete"];

const ACTION_META = {
  read: {
    label: "Lihat",
    icon: Eye,
  },
  create: {
    label: "Tambah",
    icon: Plus,
  },
  update: {
    label: "Ubah",
    icon: Pencil,
  },
  delete: {
    label: "Hapus",
    icon: Trash2,
  },
} as const;

function getPermissionAction(name: string) {
  return name.split("_")[0] || "";
}

function getPermissionModule(name: string) {
  const [, ...parts] = name.split("_");
  return parts.join("_") || "general";
}

function formatName(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function RolePermissionsPage() {
  const params = useParams();
  const router = useRouter();
  const roleId = params.id as string;

  const { fetchApi } = useApi();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [roleName, setRoleName] = useState("");
  const [search, setSearch] = useState("");

  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});

  const fetchData = async () => {
    setLoading(true);

    try {
      const resRole = await fetchApi(`/roles/${roleId}`);

      if (!resRole.ok) {
        throw new Error("Gagal memuat data role");
      }

      const roleResponse = await resRole.json();
      const roleData = roleResponse.data || roleResponse;

      setRoleName(roleData.name || "");

      const resRolePerms = await fetchApi(`/roles/${roleId}/permissions`);

      if (!resRolePerms.ok) {
        throw new Error("Gagal memuat permissions role");
      }

      const rolePermsData = await resRolePerms.json();

      const assignedIds = (rolePermsData.data || []).map(
        (permission: Permission) => permission.id,
      );

      setSelectedPermissions(assignedIds);

      const resAllPerms = await fetchApi("/roles/permissions/all");

      if (!resAllPerms.ok) {
        throw new Error("Gagal memuat seluruh permission");
      }

      const allPermsData = await resAllPerms.json();

      setAllPermissions(allPermsData.data || allPermsData || []);
    } catch (error) {
      console.error(error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat memuat data",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (roleId) {
      fetchData();
    }
  }, [roleId]);

  const permissionMap = useMemo(() => {
    return allPermissions.reduce(
      (acc, permission) => {
        const moduleName = getPermissionModule(permission.name);

        if (!acc[moduleName]) {
          acc[moduleName] = [];
        }

        acc[moduleName].push(permission);

        return acc;
      },
      {} as Record<string, Permission[]>,
    );
  }, [allPermissions]);

  const sections = useMemo<PermissionSection[]>(() => {
    const configuredModules = new Set<string>();

    const mappedSections = PERMISSION_GROUPS.map((group) => {
      const modules = group.modules
        .map((moduleConfig) => {
          configuredModules.add(moduleConfig.module);

          const permissions = [
            ...(permissionMap[moduleConfig.module] || []),
          ].sort((a, b) => {
            const actionA = getPermissionAction(a.name);
            const actionB = getPermissionAction(b.name);

            return (
              ACTION_ORDER.indexOf(actionA) - ACTION_ORDER.indexOf(actionB)
            );
          });

          return {
            module: moduleConfig.module,
            label: moduleConfig.label,
            permissions,
          };
        })
        .filter((module) => module.permissions.length > 0);

      return {
        title: group.title,
        description: group.description,
        modules,
      };
    }).filter((section) => section.modules.length > 0);

    const unknownModules = Object.entries(permissionMap)
      .filter(([moduleName]) => !configuredModules.has(moduleName))
      .map(([moduleName, permissions]) => ({
        module: moduleName,
        label: formatName(moduleName),
        permissions: [...permissions].sort((a, b) => {
          const actionA = getPermissionAction(a.name);
          const actionB = getPermissionAction(b.name);

          return ACTION_ORDER.indexOf(actionA) - ACTION_ORDER.indexOf(actionB);
        }),
      }));

    if (unknownModules.length > 0) {
      mappedSections.push({
        title: "Lainnya",
        description:
          "Permission baru yang belum dimasukkan ke konfigurasi kategori.",
        modules: unknownModules,
      });
    }

    return mappedSections;
  }, [permissionMap]);

  const filteredSections = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return sections;
    }

    return sections
      .map((section) => {
        const modules = section.modules
          .map((module) => {
            const matchesModule =
              module.label.toLowerCase().includes(keyword) ||
              module.module.toLowerCase().includes(keyword);

            const permissions = matchesModule
              ? module.permissions
              : module.permissions.filter((permission) =>
                  [
                    permission.name,
                    permission.description,
                    formatName(permission.name),
                  ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase()
                    .includes(keyword),
                );

            return {
              ...module,
              permissions,
            };
          })
          .filter((module) => module.permissions.length > 0);

        return {
          ...section,
          modules,
        };
      })
      .filter((section) => section.modules.length > 0);
  }, [sections, search]);

  useEffect(() => {
    if (!search.trim()) {
      return;
    }

    const sectionsState: Record<string, boolean> = {};
    const modulesState: Record<string, boolean> = {};

    filteredSections.forEach((section) => {
      sectionsState[section.title] = true;

      section.modules.forEach((module) => {
        modulesState[module.module] = true;
      });
    });

    setOpenSections((prev) => ({
      ...prev,
      ...sectionsState,
    }));

    setOpenModules((prev) => ({
      ...prev,
      ...modulesState,
    }));
  }, [search]);

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId],
    );
  };

  const togglePermissions = (permissions: Permission[]) => {
    const ids = permissions.map((permission) => permission.id);

    const allSelected = ids.every((id) => selectedPermissions.includes(id));

    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((id) => !ids.includes(id)));

      return;
    }

    setSelectedPermissions((prev) => Array.from(new Set([...prev, ...ids])));
  };

  const toggleSection = (title: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [title]: !(prev[title] ?? true),
    }));
  };

  const toggleModule = (module: string) => {
    setOpenModules((prev) => ({
      ...prev,
      [module]: !(prev[module] ?? false),
    }));
  };

  const selectAll = () => {
    setSelectedPermissions(allPermissions.map((permission) => permission.id));
  };

  const clearAll = () => {
    setSelectedPermissions([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSubmitting(true);

    try {
      const res = await fetchApi(`/roles/${roleId}/permissions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          permissionIds: selectedPermissions,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));

        throw new Error(errorData.message || "Gagal menyimpan permissions");
      }

      toast.success("Hak akses berhasil diperbarui");

      router.push("/super-admin/users/roles");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal menyimpan permissions",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto w-full space-y-6 pb-10">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  const selectedCount = selectedPermissions.length;
  const totalPermissions = allPermissions.length;

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full space-y-6 pb-28">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" asChild>
          <Link href="/super-admin/users/roles">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>

        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Role Permissions
          </h1>

          <p className="text-sm text-muted-foreground">
            Atur akses menu dan fitur berdasarkan kelompok sistem.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b bg-muted/20">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>

              <div>
                <CardTitle>{roleName}</CardTitle>

                <CardDescription>
                  {selectedCount} dari {totalPermissions} permission aktif
                </CardDescription>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={selectAll}>
                <CheckSquare className="mr-2 h-4 w-4" />
                Pilih Semua
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearAll}>
                <Square className="mr-2 h-4 w-4" />
                Kosongkan
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari module atau permission..."
          className="pl-9 pr-9"
        />

        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="space-y-4">
        {filteredSections.map((section) => {
          const sectionPermissions = section.modules.flatMap(
            (module) => module.permissions,
          );

          const selectedSectionCount = sectionPermissions.filter((permission) =>
            selectedPermissions.includes(permission.id),
          ).length;

          const isSectionOpen = openSections[section.title] ?? true;

          return (
            <Card key={section.title} className="overflow-hidden">
              <CardHeader className="border-b bg-muted/20 p-4">
                <div className="flex items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => toggleSection(section.title)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    {isSectionOpen ? (
                      <ChevronDown className="h-4 w-4 shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0" />
                    )}

                    <div className="min-w-0">
                      <CardTitle className="text-base">
                        {section.title}
                      </CardTitle>

                      <CardDescription className="mt-1">
                        {section.description}
                      </CardDescription>
                    </div>
                  </button>

                  <div className="flex items-center gap-3">
                    <span className="whitespace-nowrap text-xs text-muted-foreground">
                      {selectedSectionCount}/{sectionPermissions.length}
                    </span>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => togglePermissions(sectionPermissions)}>
                      Semua
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {isSectionOpen && (
                <CardContent className="space-y-3 p-4">
                  {section.modules.map((module) => {
                    const selectedModuleCount = module.permissions.filter(
                      (permission) =>
                        selectedPermissions.includes(permission.id),
                    ).length;

                    const allModuleSelected =
                      module.permissions.length > 0 &&
                      selectedModuleCount === module.permissions.length;

                    const isModuleOpen = openModules[module.module] ?? false;

                    return (
                      <div
                        key={module.module}
                        className="overflow-hidden rounded-lg border">
                        <div className="flex items-center justify-between gap-3 bg-muted/10 p-3">
                          <button
                            type="button"
                            onClick={() => toggleModule(module.module)}
                            className="flex flex-1 items-center gap-2 text-left">
                            {isModuleOpen ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}

                            <div>
                              <p className="text-sm font-semibold">
                                {module.label}
                              </p>

                              <p className="text-xs text-muted-foreground">
                                {selectedModuleCount} dari{" "}
                                {module.permissions.length} aktif
                              </p>
                            </div>
                          </button>

                          <Button
                            type="button"
                            variant={
                              allModuleSelected ? "secondary" : "outline"
                            }
                            size="sm"
                            onClick={() =>
                              togglePermissions(module.permissions)
                            }>
                            {allModuleSelected ? (
                              <>
                                <Check className="mr-1.5 h-3.5 w-3.5" />
                                Terpilih
                              </>
                            ) : (
                              <>
                                <Square className="mr-1.5 h-3.5 w-3.5" />
                                Semua
                              </>
                            )}
                          </Button>
                        </div>

                        {isModuleOpen && (
                          <div className="grid grid-cols-1 gap-2 border-t p-3 sm:grid-cols-2 xl:grid-cols-4">
                            {module.permissions.map((permission) => {
                              const selected = selectedPermissions.includes(
                                permission.id,
                              );

                              const action = getPermissionAction(
                                permission.name,
                              );

                              const meta =
                                ACTION_META[action as keyof typeof ACTION_META];

                              const Icon = meta?.icon || ShieldCheck;

                              return (
                                <label
                                  key={permission.id}
                                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                                    selected
                                      ? "border-primary/30 bg-primary/5"
                                      : "hover:bg-muted/40"
                                  }`}>
                                  <Checkbox
                                    checked={selected}
                                    onCheckedChange={() =>
                                      togglePermission(permission.id)
                                    }
                                    className="mt-0.5"
                                  />

                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />

                                      <span className="text-sm font-medium">
                                        {meta?.label || formatName(action)}
                                      </span>
                                    </div>

                                    {permission.description && (
                                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                        {permission.description}
                                      </p>
                                    )}
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t bg-background/95 p-4 backdrop-blur md:left-[var(--sidebar-width)]">
        <div className="flex items-center justify-between gap-4">
          <div className="hidden text-sm text-muted-foreground sm:block">
            <span className="font-semibold text-foreground">
              {selectedCount}
            </span>{" "}
            permission akan diterapkan ke{" "}
            <span className="font-semibold text-foreground">{roleName}</span>
          </div>

          <div className="ml-auto flex gap-2">
            <Button type="button" variant="outline" asChild>
              <Link href="/super-admin/users/roles">Batal</Link>
            </Button>

            <Button type="submit" disabled={submitting}>
              <Save className="mr-2 h-4 w-4" />

              {submitting ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
