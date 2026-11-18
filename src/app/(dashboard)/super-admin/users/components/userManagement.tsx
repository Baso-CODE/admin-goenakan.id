"use client";

import {
  Loader2,
  MailPlus,
  Pencil,
  Search,
  Trash2,
  UserPlus,
} from "lucide-react";
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

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDebounce } from "@/helper/debounce";
import { useApi } from "@/hooks/useApi";

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  createdAt: string;
  invitationPending: boolean;
  role: {
    name: string;
  };
}

const formatRole = (role: string): string =>
  role ? role.replace(/_/g, " ") : "NO ROLE";

export default function UserManagementPage() {
  const { fetchApi, status } = useApi();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const debouncedSearch = useDebounce(search, 800);

  // ===================================================
  // FETCH USERS
  // ===================================================
  const fetchUsers = async () => {
    if (status !== "authenticated") return;

    setLoading(true);

    try {
      const response = await fetchApi("/users");

      if (!response.ok) {
        throw new Error("Gagal mengambil data User.");
      }

      const data: User[] = await response.json();

      setUsers(data);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal memuat User.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      void fetchUsers();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // ===================================================
  // RESEND INVITATION
  // ===================================================

  const handleResendInvitation = async () => {
    if (
      status !== "authenticated" ||
      !selectedUser ||
      !selectedUser.invitationPending ||
      resendingId !== null
    ) {
      return;
    }

    const user = selectedUser;

    setResendingId(user.id);

    try {
      const response = await fetchApi(`/users/${user.id}/resend-invitation`, {
        method: "POST",
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.message || "Gagal mengirim ulang email aktivasi.",
        );
      }

      toast.success(`Email aktivasi berhasil dikirim ulang ke ${user.email}`, {
        duration: 5000,
      });

      // Tutup modal setelah email berhasil dikirim.
      setSelectedUser(null);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat mengirim email.",
      );

      // Jika gagal, modal tetap terbuka agar bisa dicoba lagi.
    } finally {
      setResendingId(null);
    }
  };

  // ===================================================
  // SEARCH
  // ===================================================
  const filteredUsers = users.filter((user) => {
    const keyword = debouncedSearch.trim().toLowerCase();

    return (
      (user.name || "").toLowerCase().includes(keyword) ||
      user.email.toLowerCase().includes(keyword) ||
      formatRole(user.role?.name).toLowerCase().includes(keyword)
    );
  });

  return (
    <div className="mx-auto w-full space-y-5 pb-10">
      {/* HEADER */}
      <Card className="border-l-4 border-l-primary shadow-sm">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">
              User Management
            </CardTitle>

            <p className="mt-1 text-sm text-muted-foreground">
              Kelola pengguna, hak akses, dan undangan aktivasi akun Goenakan.
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

            <Input
              type="text"
              placeholder="Cari nama, email, atau role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 rounded-lg pl-10"
            />
          </div>
        </CardHeader>
      </Card>

      {/* CREATE BUTTON */}
      <div className="flex justify-end">
        <Button asChild className="gap-2">
          <Link href="/super-admin/users/add">
            <UserPlus className="h-4 w-4" />
            Add New User
          </Link>
        </Button>
      </div>

      {/* TABLE */}
      <Card className="w-full overflow-hidden shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="whitespace-nowrap">
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status Aktivasi</TableHead>
                  <TableHead>Join Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <TableRow key={index}>
                      {Array.from({ length: 6 }).map((_, column) => (
                        <TableCell key={column}>
                          <Skeleton className="h-6 w-28" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-muted/30">
                      {/* USER */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-primary/10">
                            {user.image ? (
                              <img
                                src={user.image}
                                alt={user.name || "User"}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-xs font-bold text-primary">
                                {(user.name || "US").slice(0, 2).toUpperCase()}
                              </span>
                            )}
                          </div>

                          <span className="font-medium">
                            {user.name || "Unnamed User"}
                          </span>
                        </div>
                      </TableCell>

                      {/* EMAIL */}
                      <TableCell className="text-muted-foreground">
                        {user.email}
                      </TableCell>

                      {/* ROLE */}
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="border-primary/20 bg-primary/5 text-primary">
                          {formatRole(user.role?.name)}
                        </Badge>
                      </TableCell>

                      {/* ACTIVATION */}
                      <TableCell>
                        {user.invitationPending ? (
                          <Badge
                            variant="outline"
                            className="border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            Menunggu Aktivasi
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Tidak ada undangan tertunda
                          </span>
                        )}
                      </TableCell>

                      {/* DATE */}
                      <TableCell className="text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>

                      {/* ACTIONS */}
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          {user.invitationPending && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={resendingId !== null}
                              onClick={() => setSelectedUser(user)}
                              className="gap-2 border-primary/30 text-primary hover:bg-primary/10 hover:text-primary">
                              {resendingId === user.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MailPlus className="h-4 w-4" />
                              )}

                              {resendingId === user.id
                                ? "Mengirim..."
                                : "Kirim Ulang"}
                            </Button>
                          )}

                          <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            className="text-primary hover:bg-primary/10 hover:text-primary">
                            <Link
                              href={`/super-admin/users/edit/${user.id}`}
                              aria-label={`Edit ${user.name || user.email}`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Delete user"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() =>
                              toast.info("Fitur hapus belum disambungkan.")
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
                      colSpan={6}
                      className="py-12 text-center text-muted-foreground">
                      Tidak ada pengguna yang sesuai dengan pencarian.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ==========================================
    CONFIRM RESEND INVITATION DIALOG
========================================== */}
      <AlertDialog
        open={selectedUser !== null}
        onOpenChange={(open) => {
          if (!open && resendingId === null) {
            setSelectedUser(null);
          }
        }}>
        <AlertDialogContent className="max-w-md rounded-2xl border-border bg-card p-6 shadow-xl sm:p-7">
          <AlertDialogHeader className="space-y-4 text-left">
            {/* ICON */}
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10">
              <MailPlus className="h-7 w-7 text-primary" />
            </div>

            {/* TITLE */}
            <div className="space-y-2">
              <AlertDialogTitle className="text-xl font-bold tracking-tight text-foreground">
                Kirim Ulang Undangan?
              </AlertDialogTitle>

              <AlertDialogDescription className="text-sm leading-6 text-muted-foreground">
                Anda akan mengirim ulang email aktivasi akun Goenakan Indonesia
                kepada pengguna berikut.
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>

          {/* USER INFORMATION */}
          <div className="space-y-3 rounded-xl border border-border bg-muted/40 p-4">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Nama Pengguna
              </p>

              <p className="text-sm font-semibold text-foreground">
                {selectedUser?.name || "Unnamed User"}
              </p>
            </div>

            <div className="h-px bg-border" />

            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Alamat Email
              </p>

              <p className="break-all text-sm font-medium text-primary">
                {selectedUser?.email || "-"}
              </p>
            </div>

            <div className="h-px bg-border" />

            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Role
              </p>

              <p className="text-sm font-medium text-foreground">
                {selectedUser?.role?.name?.replace(/_/g, " ") || "-"}
              </p>
            </div>
          </div>

          {/* INFORMATION */}
          <div className="flex items-start gap-3 rounded-xl border border-primary/15 bg-primary/5 px-4 py-3">
            <MailPlus className="mt-0.5 h-4 w-4 shrink-0 text-primary" />

            <p className="text-xs leading-6 text-muted-foreground">
              Sistem akan mengirimkan link aktivasi baru yang berlaku selama{" "}
              <strong>24 jam</strong>. Link aktivasi sebelumnya otomatis tidak
              berlaku. Akun pengguna tidak akan dibuat ulang.
            </p>
          </div>

          {/* ACTIONS */}
          <AlertDialogFooter className="mt-2 gap-2 sm:gap-3">
            <AlertDialogCancel
              disabled={resendingId !== null}
              className="h-10 rounded-lg border-border px-5">
              Batal
            </AlertDialogCancel>

            <AlertDialogAction
              disabled={!selectedUser || resendingId !== null}
              onClick={(event) => {
                // Jangan tutup modal sebelum API selesai.
                event.preventDefault();

                void handleResendInvitation();
              }}
              className="h-10 gap-2 rounded-lg bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary/90">
              {resendingId !== null ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Mengirim...
                </>
              ) : (
                <>
                  <MailPlus className="h-4 w-4" />
                  Ya, Kirim Ulang
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
