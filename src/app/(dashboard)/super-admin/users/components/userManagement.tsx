"use client";

import { Pencil, Search, Trash2, UserPlus } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
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

// --- Definisi Tipe (Sesuai dengan balikan dari UserService backend) ---
interface User {
  id: string;
  name: string;
  email: string;
  image: string | null;
  createdAt: string;
  role: {
    name: string;
  };
}

// Helper function untuk memformat Role
const formatRole = (role: string): string => {
  if (!role) return "NO ROLE";
  return role.replace(/_/g, " ");
};

export default function UserManagementPage() {
  const { fetchApi, status } = useApi();
  const { data: session } = useSession();

  // === STATE ===
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");

  // Jika backend belum pakai pagination, kita pakai pencarian di sisi client (Client-side filtering)
  const debouncedSearch = useDebounce(search, 300);

  // === FETCH DATA DARI BACKEND ===
  const fetchUsers = async () => {
    if (status !== "authenticated") return;

    setLoading(true);
    try {
      // Pastikan endpoint ini sesuai dengan yang Anda set di UserRouter (misal: /users)
      const res = await fetchApi("/users");

      if (!res.ok) {
        throw new Error("Gagal mengambil data user");
      }

      const data = await res.json();
      setUsers(data);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Terjadi kesalahan server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // === CLIENT-SIDE FILTERING ===
  const filteredUsers = users.filter((user) => {
    const searchLower = debouncedSearch.toLowerCase();
    return (
      (user.name && user.name.toLowerCase().includes(searchLower)) ||
      (user.email && user.email.toLowerCase().includes(searchLower)) ||
      (user.role?.name &&
        formatRole(user.role.name).toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="space-y-12 w-full mx-auto pb-10">
      {/* ========================================== */}
      {/* BAGIAN 1: TABEL USER MANAGEMENT            */}
      {/* ========================================== */}
      <div className="space-y-5">
        {/* === HEADER CARD & SEARCH === */}
        <Card className="border-l-4 border-l-blue-600 shadow-sm">
          <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold">
                User Management
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Kelola data pengguna sistem dan hak akses mereka.
              </p>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search name, email, or role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-10 rounded-lg"
              />
            </div>
          </CardHeader>
        </Card>

        {/* === ADD USER BUTTON === */}
        <div className="flex justify-end">
          <Link href="/super-admin/users/add">
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700 transition duration-200">
              <UserPlus className="h-4 w-4" />
              Add New User
            </Button>
          </Link>
        </div>

        {/* === TABLE CARD === */}
        <Card className="w-full overflow-hidden shadow-sm border-t-0">
          <CardContent className="p-0">
            <div className="overflow-x-auto border rounded-md">
              <Table className="whitespace-nowrap">
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="min-w-45">User</TableHead>
                    <TableHead className="min-w-60">Email</TableHead>
                    <TableHead className="min-w-40">Role</TableHead>
                    <TableHead className="min-w-30">Join Date</TableHead>
                    <TableHead className="text-right min-w-30 sticky right-0 bg-white shadow-[-10px_0_15px_-5px_rgba(0,0,0,0.05)]">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton className="h-5 w-32" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-48" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-24 rounded-full" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-24" />
                        </TableCell>
                        <TableCell className="sticky right-0 bg-white">
                          <Skeleton className="h-8 w-16 ml-auto" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <TableRow
                        key={user.id}
                        className="hover:bg-gray-50/50 dark:hover:bg-gray-900/50">
                        <TableCell className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-3">
                          {/* Tampilkan Image jika ada, jika tidak pakai inisial (Opsional) */}
                          <div className="h-8 w-8 rounded-full bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center border">
                            {user.image ? (
                              <img
                                src={user.image}
                                alt={user.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-xs font-bold text-slate-500">
                                {user.name?.substring(0, 2).toUpperCase() ||
                                  "US"}
                              </span>
                            )}
                          </div>
                          {user.name}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {user.email}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              user.role?.name === "SUPER_ADMIN"
                                ? "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900 dark:text-purple-300"
                                : "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900 dark:text-blue-300"
                            }>
                            {formatRole(user.role?.name)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString(
                            "id-ID",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </TableCell>
                        <TableCell className="text-right sticky right-0 bg-white shadow-[-10px_0_15px_-5px_rgba(0,0,0,0.05)]">
                          <div className="flex justify-end gap-2">
                            <Link href={`/super-admin/users/edit/${user.id}`}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </Link>
                            {/* Jika Anda sudah punya fungsi Delete di backend, tambahkan handler di sini */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() =>
                                toast.info("Fitur hapus belum disambungkan")
                              }>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-10 text-muted-foreground">
                        Tidak ada pengguna yang sesuai dengan pencarian Anda.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
