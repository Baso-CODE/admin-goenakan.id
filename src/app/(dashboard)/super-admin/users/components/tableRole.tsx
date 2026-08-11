"use client";

import { KeyRound, Pencil, Search, ShieldCheck, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useDebounce } from "@/helper/debounce";
import { useApi } from "@/hooks/useApi";
import { useSession } from "next-auth/react";
import Link from "next/link";

// === TYPES ===
type Role = {
  id: string;
  name: string;
  description: string | null;
  _count: {
    users: number;
  };
};

type Meta = {
  hasNext: boolean;
  hasPrevious: boolean;
  page: number;
  perPage: number;
  total: number;
};

export default function TableRole() {
  const { fetchApi, status } = useApi();
  const { data: session } = useSession();

  // === STATE ===
  const [roles, setRoles] = useState<Role[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [page, setPage] = useState(1);

  // === FETCH ROLES ===
  const fetchRoles = async () => {
    if (status !== "authenticated") return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        take: "10",
      });

      if (debouncedSearch) params.append("search", debouncedSearch);

      const res = await fetchApi(`/roles?${params}`);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to fetch roles");
      }

      const result = await res.json();
      setRoles(result.data || []);
      setMeta(result.meta);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat data Role");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch, status, fetchApi]);

  // === HANDLER DELETE ===
  const handleDelete = async (id: string, roleName: string) => {
    if (roleName === "SUPER_ADMIN") {
      return toast.error("Role SUPER_ADMIN tidak dapat dihapus!");
    }

    if (!confirm(`Apakah Anda yakin ingin menghapus role ${roleName}?`)) return;

    try {
      const res = await fetchApi(`/roles/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to delete role");
      }

      toast.success("Role berhasil dihapus!");
      fetchRoles();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // === RENDER ===
  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden mx-auto pb-10">
      {/* Header Card */}
      <Card className="border-l-4 border-l-blue-600 shadow-sm">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShieldCheck className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">
                Role Management
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Atur peran dan hak akses untuk pengguna sistem.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative w-full md:w-62.5">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search Role Name..."
                className="pl-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            {/* Tombol Tambah Role */}
            <Link href="/super-admin/roles/add">
              <Button className="w-full md:w-auto bg-blue-600 hover:bg-blue-700">
                + Add Role
              </Button>
            </Link>
          </div>
        </CardHeader>
      </Card>

      {/* Main Table Card */}
      <Card className="shadow-sm border-t-0 w-full overflow-hidden">
        <CardContent className="p-0">
          <div className="rounded-md border overflow-x-auto w-full">
            <Table className="whitespace-nowrap min-w-full">
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-1/4">Role Name</TableHead>
                  <TableHead className="w-1/2">Description</TableHead>
                  <TableHead className="w-32 text-center">
                    Total Users
                  </TableHead>
                  <TableHead className="text-center sticky right-0 bg-white shadow-[-10px_0_15px_-5px_rgba(0,0,0,0.05)] w-40">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-5 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-64" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-16 mx-auto" />
                      </TableCell>
                      <TableCell className="sticky right-0 bg-white">
                        <Skeleton className="h-8 w-24 mx-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : roles.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-24 text-center text-muted-foreground">
                      No roles found matching your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  roles.map((role) => {
                    const isSuperAdmin = role.name === "SUPER_ADMIN";
                    return (
                      <TableRow key={role.id} className="hover:bg-muted/5">
                        <TableCell className="font-bold text-gray-800">
                          {isSuperAdmin ? (
                            <Badge className="bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200">
                              {role.name}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-700">
                              {role.name}
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell className="text-sm text-gray-600 truncate max-w-sm">
                          {role.description || (
                            <span className="italic text-gray-400">
                              No description provided
                            </span>
                          )}
                        </TableCell>

                        <TableCell className="text-center">
                          <Badge variant="secondary" className="font-mono">
                            {role._count.users}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-center sticky right-0 bg-white shadow-[-10px_0_15px_-5px_rgba(0,0,0,0.05)]">
                          <div className="flex items-center justify-center gap-1">
                            {/* ✨ Tombol Atur Akses / Permissions */}
                            <Link
                              href={`/super-admin/users/roles/permissions/${role.id}`}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                title="Manage Permissions">
                                <KeyRound className="h-4 w-4" />
                              </Button>
                            </Link>

                            {/* Tombol Edit */}
                            <Link href={`/super-admin/roles/edit/${role.id}`}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                title="Edit Role">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </Link>

                            {/* Tombol Delete */}
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={isSuperAdmin || role._count.users > 0}
                              onClick={() => handleDelete(role.id, role.name)}
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-30 disabled:hover:bg-transparent"
                              title={
                                isSuperAdmin
                                  ? "Cannot delete SUPER_ADMIN"
                                  : role._count.users > 0
                                    ? "Cannot delete role with active users"
                                    : "Delete Role"
                              }>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination Footer */}
      {meta && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-muted-foreground">
            Showing Page <strong>{meta.page}</strong> of{" "}
            <strong>{Math.ceil(meta.total / meta.perPage)} </strong> (
            {meta.total} total roles)
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!meta.hasPrevious}
              onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!meta.hasNext}
              onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
