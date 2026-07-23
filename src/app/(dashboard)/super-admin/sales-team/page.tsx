"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { useDebounce } from "@/helper/debounce";
import { useApi } from "@/hooks/useApi";
import { cn } from "@/lib/utils"; // Pastikan path utils Anda benar
import { formatDate } from "@/utils/formatDate";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  FileDown,
  Loader2,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// === Type definitions ===
type SalesPerson = {
  id: string;
  prefix: string;
  name: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
  signatureUrl?: string;
  bankAccounts?: {
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
  }[];
};

type Meta = {
  hasNext: boolean;
  hasPrevious: boolean;
  page: number;
  perPage: number;
  total: number;
};

// Interface untuk Query Export Sales
interface SalesExportQuery {
  startDate?: string;
  endDate?: string;
  isActive?: "true" | "false" | "ALL";
}

const Sales = () => {
  const { fetchApi, status } = useApi();

  // --- STATE DATA DAN PAGINATION ---
  const [sales, setSales] = useState<SalesPerson[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);

  // --- STATE UNTUK EXPORT FILTER ---
  const [exportStartDate, setExportStartDate] = useState<Date | undefined>(
    undefined,
  );
  const [exportEndDate, setExportEndDate] = useState<Date | undefined>(
    undefined,
  );
  const [exportIsActive, setExportIsActive] = useState<string>("ALL");
  const [exporting, setExporting] = useState<boolean>(false);

  // --- FUNGSI FETCH DATA (Untuk Tabel) ---
  const fetchSales = async () => {
    if (status !== "authenticated") return;

    setLoading(true);
    setError(null);
    try {
      // 1. Build Query Params
      const params = new URLSearchParams({
        page: page.toString(),
        take: "10",
        isActive: statusFilter,
      });

      if (debouncedSearch.trim()) {
        params.append("search", debouncedSearch.trim());
      }

      // Pastikan format tanggal aman sebelum dikirim
      if (exportStartDate) {
        params.append(
          "startDate",
          format(new Date(exportStartDate), "yyyy-MM-dd"),
        );
      }
      if (exportEndDate) {
        params.append("endDate", format(new Date(exportEndDate), "yyyy-MM-dd"));
      }

      // 2.  Gunakan fetchApi (Otomatis handle Base URL dan Token)
      const res = await fetchApi(`/sales?${params}`);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to fetch sales data.");
      }

      const result = await res.json();
      setSales(result.data || []);
      setMeta(result.meta);
    } catch (error: any) {
      console.error("❌ Load Sales Error:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
      toast.error(error.message || "Failed to load sales data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [
    page,
    debouncedSearch,
    statusFilter,
    exportStartDate,
    exportEndDate,
    status,
    fetchApi,
  ]);
  // --- FUNGSI HANDLE EXPORT (Implementasi Baru) ---
  const handleExportSales = async () => {
    setExporting(true);
    try {
      // 1. Ambil Token Autentikasi

      // 2. Kumpulkan Filter (menggunakan state filter export)
      const exportFilters: SalesExportQuery = {
        ...(exportStartDate && {
          startDate: format(new Date(exportStartDate), "yyyy-MM-dd"),
        }),
        ...(exportEndDate && {
          endDate: format(new Date(exportEndDate), "yyyy-MM-dd"),
        }),
        ...(exportIsActive !== "ALL" && {
          isActive: exportIsActive as "true" | "false",
        }),
      };

      const queryString = new URLSearchParams(
        exportFilters as Record<string, string>,
      ).toString();

      const response = await fetchApi(`/sales/export/excel?${queryString}`, {
        method: "GET",
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.error("❌ Export Server Error:", errData);
        throw new Error(
          errData.message || "Export failed. Server responded with an error.",
        );
      }
      // 3. Proses File Binary (Blob)
      const blob = await response.blob();
      const contentDisposition = response.headers.get("Content-Disposition");

      const filenameMatch = contentDisposition?.match(/filename="(.+?)"/i);
      const filename = filenameMatch
        ? filenameMatch[1]
        : `sales_export_${new Date().toISOString().slice(0, 10)}.xlsx`;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Data Sales berhasil di-export ke Excel!");
    } catch (error) {
      console.error("Export Error:", error);
      toast.error("Gagal meng-export data. Periksa koneksi atau hak akses.");
    } finally {
      setExporting(false);
    }
  };

  // === RENDER ===
  return (
    <div className="space-y-4 overflow-x-hidden w-full mx-auto">
      {/* === Header & Search/Filter Tabel === */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 overflow-x-auto">
          <CardTitle className="text-xl font-semibold whitespace-nowrap">
            Sales Team Management 📈
          </CardTitle>

          <div className="flex flex-wrap md:flex-nowrap gap-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-1 md:w-64 min-w-50">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search sales name or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>

            {/* Filter active/inactive (Untuk Tabel) */}
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val);
                setPage(1); // Reset page saat filter tabel berubah
              }}>
              <SelectTrigger className="w-37.5 min-w-37.5">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* --- FILTER DAN EXPORT BARU --- */}
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          <h3 className="w-full text-sm font-semibold text-muted-foreground">
            Export Filter (opsional, berdasarkan Created Date):
          </h3>

          {/* Filter Status Aktif (Untuk Export) */}
          <div className="flex flex-col">
            <label className="text-xs font-medium text-muted-foreground mb-1">
              Status (Export)
            </label>
            <Select value={exportIsActive} onValueChange={setExportIsActive}>
              <SelectTrigger className="w-30">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-medium text-muted-foreground mb-1">
              Start Date
            </label>

            <div className="relative">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-50 justify-start text-left font-normal pr-10",
                      !exportStartDate && "text-muted-foreground",
                    )}>
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                    <span className="truncate">
                      {exportStartDate
                        ? format(exportStartDate, "PPP")
                        : "Pick a date"}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={exportStartDate}
                    onSelect={(date) => {
                      setExportStartDate(date);
                      setPage(1);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {/* Tombol Reset Tanggal */}
              {exportStartDate && (
                <X
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer hover:text-black"
                  onClick={() => {
                    setExportStartDate(undefined);
                    setPage(1);
                  }}
                />
              )}
            </div>
          </div>

          {/* Filter Tanggal Akhir */}
          <div className="flex flex-col">
            <label className="text-xs font-medium text-muted-foreground mb-1">
              End Date
            </label>

            <div className="relative">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-50 justify-start text-left font-normal pr-10",
                      !exportEndDate && "text-muted-foreground",
                    )}>
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                    <span className="truncate">
                      {exportEndDate
                        ? format(exportEndDate, "PPP")
                        : "Pick a date"}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={exportEndDate}
                    onSelect={(date) => {
                      setExportEndDate(date);
                      setPage(1);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {exportEndDate && (
                <X
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer hover:text-black"
                  onClick={() => {
                    setExportEndDate(undefined);
                    setPage(1);
                  }}
                />
              )}
            </div>
          </div>

          {/* Tombol Add Sales */}
          <Link href="/super-admin/sales-team/add" className="ml-auto">
            <Button size="sm" className="gap-2 cursor-pointer">
              + Add Sales Person
            </Button>
          </Link>

          {/* Tombol Export */}
          <Button
            size="sm"
            className="gap-2 bg-green-600 hover:bg-green-700"
            onClick={handleExportSales}
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

      {/* === Table === */}
      <Card className="w-full">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-62.5">Prefix & Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell className="h-12 w-62.5">
                        <Skeleton className="h-4 w-50" />
                      </TableCell>
                      <TableCell className="h-12">
                        <Skeleton className="h-4 w-30" />
                      </TableCell>
                      <TableCell className="h-12">
                        <Skeleton className="h-4 w-15" />
                      </TableCell>
                      <TableCell className="h-12">
                        <Skeleton className="h-4 w-25" />
                      </TableCell>
                      <TableCell className="h-12 text-center">
                        <div className="flex justify-end space-x-2">
                          <Skeleton className="h-8 w-12.5" />
                          <Skeleton className="h-8 w-15" />
                          <Skeleton className="h-8 w-15" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : error ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-red-500 py-6">
                      Error: {error || "Failed to load sales data."}
                    </TableCell>
                  </TableRow>
                ) : sales.length > 0 ? (
                  sales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">
                        <span className="font-bold mr-1">{sale.prefix}.</span>
                        {sale.name}
                      </TableCell>
                      <TableCell>{sale.phone}</TableCell>
                      <TableCell>
                        {sale.isActive ? (
                          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                            Active
                          </Badge>
                        ) : (
                          <Badge
                            variant="destructive"
                            className="bg-red-500/10 text-red-600 border-red-500/20">
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {formatDate(sale.createdAt, { style: "relative" })}
                      </TableCell>
                      <TableCell className="text-center space-x-2">
                        <Link
                          href={`/super-admin/sales-team/update/${sale.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="cursor-pointer">
                            Edit
                          </Button>
                        </Link>
                        <Link
                          href={`/super-admin/sales-team/detail/${sale.id}`}>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="text-xs cursor-pointer">
                            Detail
                          </Button>
                        </Link>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="text-xs cursor-pointer"
                          // onClick={() => handleDelete(sale.id)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-6 text-muted-foreground">
                      No sales found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* === Pagination === */}
      {meta && (
        <div className="flex justify-between items-center p-4 border-t text-sm text-muted-foreground">
          <p>
            Page {meta.page} of {Math.ceil(meta.total / meta.perPage)}
          </p>
          <div className="space-x-2">
            <Button
              size="sm"
              variant="outline"
              disabled={!meta.hasPrevious}
              onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={!meta.hasNext}
              onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
