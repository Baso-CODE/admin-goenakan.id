"use client";

import {
  Eye,
  FileDown,
  Loader2,
  MoreHorizontal,
  Search,
  Trash2,
  UserCircle,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { ConfirmDeleteDialog } from "@/app/(dashboard)/components/confirmDeleteDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiUrl } from "@/helper/apiurl";
import { useDebounce } from "@/helper/debounce";
import { formatDate } from "@/utils/formatDate";

type ClientType = "B2B" | "B2C";

interface ClientBase {
  id: string;
  custCode: string;
  type: ClientType;
  createdAt: string;
  phone?: string;
  email?: string;
}

interface ClientB2B extends ClientBase {
  type: "B2B";
  companyName: string;
  picName?: string;
}

interface ClientB2C extends ClientBase {
  type: "B2C";
  name: string;
}

type ClientData = ClientB2B | ClientB2C;

interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Interface untuk Query Export
interface ClientExportQuery {
  type?: ClientType | "ALL";
  startDate?: string;
  endDate?: string;
}

export default function ClientManagementTable() {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1,
    perPage: 10,
    total: 0,
    hasNext: false,
    hasPrevious: false,
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false); // State untuk proses export
  const [error, setError] = useState<string | null>(null);

  // State Filter
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500);
  const [clientTypeFilter, setClientTypeFilter] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fungsi untuk mereset halaman ke 1 saat filter utama berubah
  const handleFilterChange = (filterUpdate: Partial<ClientExportQuery>) => {
    setMeta((prev) => ({ ...prev, page: 1 }));
    // Update filter type
    if (filterUpdate.type !== undefined) {
      setClientTypeFilter(filterUpdate.type);
    }
    // Search sudah ditangani oleh debouncedSearch useEffect
  };

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      const params = new URLSearchParams({
        page: meta.page.toString(),
        take: meta.perPage.toString(),
        type: clientTypeFilter,
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });
      if (debouncedSearch.trim()) {
        params.append("search", debouncedSearch.trim());
      }

      const res = await fetch(`${apiUrl}/clients?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await res.json();
      if (res.ok) {
        setClients(result.data || []);
        setMeta(result.meta || meta);
      } else {
        throw new Error(result.message || "Failed to fetch data");
      }
    } catch (err) {
      console.error("❌ Error fetching clients:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [
    meta.page,
    meta.perPage,
    clientTypeFilter,
    debouncedSearch,
    startDate,
    endDate,
  ]);
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);
  // === FUNGSI HANDLE EXPORT ===
  const handleExport = async () => {
    setExporting(true);
    try {
      // 1. Ambil Token Autentikasi
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      // 2. Kumpulkan Filter (menggunakan semua filter yang ada)
      const exportFilters: ClientExportQuery & { search?: string } = {
        type: clientTypeFilter as ClientType | "ALL",
        // Tambahkan filter tanggal yang sedang aktif
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        // Tambahkan search/debounce search yang sedang aktif
        ...(search.trim() && { search: search.trim() }),
      };

      const queryString = new URLSearchParams(
        exportFilters as Record<string, string>,
      ).toString();

      // URL untuk export
      const exportUrl = `${apiUrl}/clients/export/excel?${queryString}`;

      const response = await fetch(exportUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server Error:", errorText);
        throw new Error("Export failed. Server responded with an error.");
      }

      // 3. Proses File Binary (Blob)
      const blob = await response.blob();
      const contentDisposition = response.headers.get("Content-Disposition");

      // Ambil nama file dari header
      const filenameMatch = contentDisposition?.match(/filename="(.+?)"/i);
      const filename = filenameMatch
        ? filenameMatch[1]
        : `clients_export_${new Date().toISOString().slice(0, 10)}.xlsx`;

      // Membuat URL objek untuk file yang akan diunduh
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename; // Nama file download
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url); // Bersihkan URL

      toast.success("Data Klien berhasil di-export ke Excel!");
    } catch (error) {
      console.error("Export Error:", error);
      toast.error(
        "Gagal meng-export data. Pastikan filter sudah benar dan Anda memiliki akses.",
      );
    } finally {
      setExporting(false);
    }
  };

  // === UTILITIES ===
  const getClientName = (client: ClientData) =>
    client.type === "B2B"
      ? (client as ClientB2B).companyName
      : (client as ClientB2C).name;

  const getClientPicOrEmail = (client: ClientData) =>
    client.type === "B2B" ? (client as ClientB2B).picName : client.email;

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      const response = await fetch(`${apiUrl}/vendors/${deleteId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Gagal menghapus kategori");
      }

      toast.success("Client berhasil dihapus");

      fetchClients();
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan saat menghapus data");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  // === RENDER ===
  return (
    <div className="space-y-4 w-full mx-auto">
      {/* === HEADER & FILTER UTAMA === */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle className="text-2xl font-bold whitespace-nowrap flex items-center gap-2">
            <UserCircle className="h-7 w-7 font-bold" />
            Client Management
          </CardTitle>

          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            {/* === FILTER TYPE === */}
            <Select
              value={clientTypeFilter}
              onValueChange={(val) =>
                handleFilterChange({ type: val as ClientType | "ALL" })
              }>
              <SelectTrigger className="w-full md:w-37.5">
                <SelectValue placeholder="Client Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Tipe</SelectItem>
                <SelectItem value="B2B">B2B (Bisnis)</SelectItem>
                <SelectItem value="B2C">B2C (Individu)</SelectItem>
              </SelectContent>
            </Select>

            {/* === SEARCH INPUT === */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search Kode, Nama, Perusahaan, atau Email..."
                value={search}
                onChange={(e) => {
                  setMeta((prev) => ({ ...prev, page: 1 }));
                  setSearch(e.target.value);
                }}
                className="pl-10 h-10 rounded-lg"
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* --- GARIS PEMISAH --- */}
      <hr />

      {/* === FILTER DAN EXPORT BARU === */}
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          <h3 className="w-full text-sm font-semibold text-muted-foreground">
            Export Filter (opsional):
          </h3>

          {/* Filter Tanggal Mulai */}
          <div className="flex flex-col">
            <label className="text-xs font-medium text-muted-foreground mb-1">
              Start Date (Created)
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setMeta((prev) => ({ ...prev, page: 1 })); // Reset page
              }}
              className="w-37.5"
            />
          </div>

          {/* Filter Tanggal Akhir */}
          <div className="flex flex-col">
            <label className="text-xs font-medium text-muted-foreground mb-1">
              End Date (Created)
            </label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setMeta((prev) => ({ ...prev, page: 1 })); // Reset page
              }}
              className="w-37.5"
            />
          </div>

          {/* Tombol Add Client */}
          <Link href="/super-admin/clients/add" className="ml-auto">
            <Button size="sm" className="gap-2">
              <UserPlus className="h-4 w-4" /> Add New Client
            </Button>
          </Link>

          {/* Tombol Export */}
          <Button
            size="sm"
            className="gap-2 bg-green-600 hover:bg-green-700"
            onClick={handleExport}
            disabled={exporting}>
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            {exporting ? "Preparing..." : "Export to Excel"}
          </Button>
        </div>
      </Card>
      {/* --- END: FILTER DAN EXPORT BARU --- */}

      {/* === TABLE === */}
      <Card className="w-full overflow-hidden shadow-lg">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-37.5 font-semibold">
                  Kode Klien
                </TableHead>
                <TableHead className="min-w-50 font-semibold">
                  Nama / Perusahaan
                </TableHead>
                <TableHead className="font-semibold">Tipe</TableHead>
                <TableHead className="min-w-37.5 font-semibold">
                  Kontak Utama
                </TableHead>
                <TableHead className="min-w-37.5 font-semibold">
                  Telepon
                </TableHead>
                <TableHead className="min-w-37.5 font-semibold">
                  Created
                </TableHead>
                <TableHead className="text-right font-semibold">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                /* Penanganan Loading menggunakan Skeleton */
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    {/* Kolom 1: Customer Code (font-mono text-xs) */}
                    <TableCell className="h-12">
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    {/* Kolom 2: Client Name (font-medium) */}
                    <TableCell className="h-12">
                      <Skeleton className="h-4 w-50" />
                    </TableCell>
                    {/* Kolom 3: Type (Badge) */}
                    <TableCell className="h-12">
                      <Skeleton className="h-4 w-12.5" />
                    </TableCell>
                    {/* Kolom 4: PIC/Email (text-sm text-muted-foreground) */}
                    <TableCell className="h-12">
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    {/* Kolom 5: Phone (text-sm) */}
                    <TableCell className="h-12">
                      <Skeleton className="h-4 w-25" />
                    </TableCell>
                    {/* Kolom 6: Created (font-mono text-xs) */}
                    <TableCell className="h-12">
                      <Skeleton className="h-4 w-25" />
                    </TableCell>
                    {/* Kolom 7: Actions (text-right) */}
                    <TableCell className="h-12 text-right">
                      <div className="flex justify-end">
                        <Skeleton className="h-8 w-15" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : error ? (
                /* Penanganan Error */
                <TableRow>
                  <TableCell
                    colSpan={7} // Jumlah kolom: 7
                    className="text-center text-red-500 py-6">
                    {error}
                  </TableCell>
                </TableRow>
              ) : clients.length > 0 ? (
                /* Menampilkan Data Client */
                clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-mono text-xs">
                      {client.custCode}
                    </TableCell>
                    <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                      {getClientName(client)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          client.type === "B2B"
                            ? "bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-900 dark:text-indigo-300"
                            : "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-300"
                        }>
                        {client.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {getClientPicOrEmail(client) || "-"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {client.phone || "-"}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {formatDate(client.createdAt, { style: "relative" })}
                    </TableCell>
                    {/* <TableCell className="text-right">
                      <Link href={`/super-admin/clients/detail/${client.id}`}>
                        <Button variant="secondary" size="sm">
                          View
                        </Button>
                      </Link>
                    </TableCell> */}

                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />{" "}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/super-admin/clients/detail/${client.id}}`}
                              className="cursor-pointer">
                              <Eye className="mr-2 h-4 w-4" /> View
                            </Link>
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600 cursor-pointer"
                            onClick={() => setDeleteId(client.id)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                /* Data Kosong */
                <TableRow>
                  <TableCell
                    colSpan={7} // Jumlah kolom: 7
                    className="text-center py-6 text-muted-foreground">
                    No clients found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* === PAGINATION === */}
      {meta.total > 0 && (
        <div className="flex justify-between items-center p-4 border-t text-sm text-muted-foreground">
          <span>
            Page {meta.page} of {Math.ceil(meta.total / meta.perPage)}
          </span>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!meta.hasPrevious}
              onClick={() =>
                setMeta((prev) => ({ ...prev, page: prev.page - 1 }))
              }>
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!meta.hasNext}
              onClick={() =>
                setMeta((prev) => ({ ...prev, page: prev.page + 1 }))
              }>
              Next
            </Button>
          </div>
        </div>
      )}

      <ConfirmDeleteDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        warningMessage="Client tidak dapat dihapus jika sudah digunakan dalam data lain. Pastikan tidak ada data yang terkait sebelum menghapus."
      />
    </div>
  );
}
