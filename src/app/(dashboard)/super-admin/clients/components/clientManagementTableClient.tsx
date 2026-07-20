"use client";

import {
  Eye,
  FileDown,
  Loader2,
  MoreHorizontal,
  Pencil,
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
  DropdownMenuSeparator,
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
import { DatePickerHelper } from "@/helper/datePickerHelper";
import { useDebounce } from "@/helper/debounce";
import { useApi } from "@/hooks/useApi";
import { cn } from "@/lib/utils";
import { formatDate } from "@/utils/formatDate";
import { format } from "date-fns";

type ClientType = "B2B" | "B2C";

//  UPDATE: Tambahkan 'status' pada interface
interface ClientBase {
  id: string;
  custCode: string;
  type: ClientType;
  status: "POTENTIAL" | "OFFICIAL" | string;
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

//  UPDATE: Tambahkan 'status' ke Query Export
interface ClientExportQuery {
  type?: ClientType | "ALL";
  status?: string;
  startDate?: string;
  endDate?: string;
}

export default function ClientManagementTable() {
  const { fetchApi, status } = useApi();

  const [clients, setClients] = useState<ClientData[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1,
    perPage: 10,
    total: 0,
    hasNext: false,
    hasPrevious: false,
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // State Filter
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500);
  const [clientTypeFilter, setClientTypeFilter] = useState<string>("ALL");
  const [clientStatusFilter, setClientStatusFilter] = useState<string>("ALL"); //  UPDATE: State Status
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleFilterChange = (filterUpdate: Partial<ClientExportQuery>) => {
    setMeta((prev) => ({ ...prev, page: 1 }));
    if (filterUpdate.type !== undefined) {
      setClientTypeFilter(filterUpdate.type);
    }
    //  UPDATE: Update filter status
    if (filterUpdate.status !== undefined) {
      setClientStatusFilter(filterUpdate.status);
    }
  };

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: meta.page.toString(),
        take: meta.perPage.toString(),
        type: clientTypeFilter,
        status: clientStatusFilter, //  UPDATE: Kirim status ke backend
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });
      if (debouncedSearch.trim()) {
        params.append("search", debouncedSearch.trim());
      }
      const res = await fetchApi(`/clients?${params}`);

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
    clientStatusFilter, //  UPDATE: Tambahkan ke dependencies
    debouncedSearch,
    startDate,
    endDate,
    fetchApi,
  ]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // === FUNGSI HANDLE EXPORT ===
  const handleExport = async () => {
    setExporting(true);
    try {
      const exportFilters: ClientExportQuery & { search?: string } = {
        type: clientTypeFilter as ClientType | "ALL",
        status: clientStatusFilter, //  UPDATE: Kirim parameter saat export
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(search.trim() && { search: search.trim() }),
      };

      const queryString = new URLSearchParams(
        exportFilters as Record<string, string>,
      ).toString();

      const response = await fetchApi(`/clients/export/excel?${queryString}`, {
        method: "GET",
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server Error:", errorText);
        throw new Error("Export failed. Server responded with an error.");
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("Content-Disposition");

      const filenameMatch = contentDisposition?.match(/filename="(.+?)"/i);
      const filename = filenameMatch
        ? filenameMatch[1]
        : `clients_export_${new Date().toISOString().slice(0, 10)}.xlsx`;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

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
      const response = await fetchApi(`/clients/${deleteId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Gagal menghapus client");
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
            {/*  UPDATE: FILTER STATUS BARU */}
            <Select
              value={clientStatusFilter}
              onValueChange={(val) => handleFilterChange({ status: val })}>
              <SelectTrigger className="w-full md:w-36">
                <SelectValue placeholder="Client Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Status</SelectItem>
                <SelectItem value="OFFICIAL">Official</SelectItem>
                <SelectItem value="POTENTIAL">Potential</SelectItem>
              </SelectContent>
            </Select>

            {/* === FILTER TYPE === */}
            <Select
              value={clientTypeFilter}
              onValueChange={(val) =>
                handleFilterChange({ type: val as ClientType | "ALL" })
              }>
              <SelectTrigger className="w-full md:w-36">
                <SelectValue placeholder="Client Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Tipe</SelectItem>
                <SelectItem value="B2B">B2B (Bisnis)</SelectItem>
                <SelectItem value="B2C">B2C (Individu)</SelectItem>
              </SelectContent>
            </Select>

            {/* === SEARCH INPUT === */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Cari Klien..."
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

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Start Date
            </label>
            <DatePickerHelper
              placeholder="Pilih Tanggal Mulai"
              date={startDate ? new Date(startDate) : undefined}
              setDate={(date) => {
                setStartDate(date ? format(date, "yyyy-MM-dd") : "");
                setMeta((prev) => ({ ...prev, page: 1 }));
              }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              End Date
            </label>
            <DatePickerHelper
              placeholder="Pilih Tanggal Akhir"
              date={endDate ? new Date(endDate) : undefined}
              setDate={(date) => {
                setEndDate(date ? format(date, "yyyy-MM-dd") : "");
                setMeta((prev) => ({ ...prev, page: 1 }));
              }}
            />
          </div>

          <Link href="/super-admin/clients/add" className="ml-auto">
            <Button size="sm" className="gap-2">
              <UserPlus className="h-4 w-4" /> Add New Client
            </Button>
          </Link>

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

      {/* === TABLE === */}
      <Card className="w-full overflow-hidden shadow-lg">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-32 font-semibold">
                  Kode Klien
                </TableHead>
                <TableHead className="min-w-48 font-semibold">
                  Nama / Perusahaan
                </TableHead>
                <TableHead className="font-semibold">Tipe</TableHead>
                {/*  UPDATE: Kolom Baru Status */}
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="min-w-36 font-semibold">
                  Kontak Utama
                </TableHead>
                <TableHead className="min-w-32 font-semibold">
                  Telepon
                </TableHead>
                <TableHead className="min-w-32 font-semibold">
                  Created
                </TableHead>
                <TableHead className="text-right font-semibold">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell className="h-12">
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell className="h-12">
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell className="h-12">
                      <Skeleton className="h-4 w-12" />
                    </TableCell>
                    <TableCell className="h-12">
                      <Skeleton className="h-4 w-16" />
                    </TableCell>{" "}
                    {/* Skeleton Status */}
                    <TableCell className="h-12">
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell className="h-12">
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="h-12">
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="h-12 text-right">
                      <div className="flex justify-end">
                        <Skeleton className="h-8 w-8" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center text-red-500 py-6">
                    {" "}
                    {/*  UPDATE: colSpan 8 */}
                    {error}
                  </TableCell>
                </TableRow>
              ) : clients.length > 0 ? (
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

                    {/*  UPDATE: Cell Baru Status */}
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "uppercase text-[10px]",
                          client.status === "POTENTIAL"
                            ? "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900 dark:text-amber-300"
                            : "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900 dark:text-emerald-300",
                        )}>
                        {client.status || "OFFICIAL"}
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

                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>

                          <DropdownMenuItem asChild>
                            <Link
                              href={`/super-admin/clients/detail/${client.id}`}
                              className="cursor-pointer">
                              <Eye className="mr-2 h-4 w-4" /> View
                            </Link>
                          </DropdownMenuItem>

                          <DropdownMenuItem asChild>
                            <Link
                              href={`/super-admin/clients/edit/${client.id}`}
                              className="cursor-pointer">
                              <Pencil className="mr-2 h-4 w-4 text-orange-600" />{" "}
                              Edit
                            </Link>
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

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
                <TableRow>
                  <TableCell
                    colSpan={8} //  UPDATE: colSpan 8
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
