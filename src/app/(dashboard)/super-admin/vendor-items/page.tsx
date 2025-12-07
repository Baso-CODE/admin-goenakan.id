"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileDown, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/utils/formatDate";
import { useDebounce } from "@/helper/debounce";
import { Skeleton } from "@/components/ui/skeleton";

type VendorCategoryOption = {
  id: string;
  name: string;
};

type VendorItem = {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  category: {
    id: string;
    name: string;
  };
};

type Meta = {
  hasNext: boolean;
  hasPrevious: boolean;
  page: number;
  perPage: number;
  total: number;
};

interface ItemExportQuery {
  startDate?: string;
  endDate?: string;
  isActive?: "true" | "false";
  categoryId?: string;
}
const VendorItems = () => {
  const [items, setItems] = useState<VendorItem[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);

  const [categoryOptions, setCategoryOptions] = useState<
    VendorCategoryOption[]
  >([]);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [exportCategoryId, setExportCategoryId] = useState<string>("ALL");

  const fetchCategoryOptions = async () => {
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();
      const res = await fetch(
        `http://localhost:8000/vendor-categories?take=1000&isActive=true`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const result = await res.json();

      setCategoryOptions(
        result.data.map((cat: any) => ({ id: cat.id, name: cat.name })) || []
      );
    } catch (error) {
      console.error("Failed to fetch category options:", error);
    }
  };

  // === FETCH DATA DARI BACKEND ===
  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();
      const params = new URLSearchParams({
        page: page.toString(),
        take: "10",
        isActive: statusFilter,
      });
      if (debouncedSearch.trim()) {
        params.append("search", debouncedSearch.trim());
      }

      const res = await fetch(`http://localhost:8000/vendor-items?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await res.json();
      setItems(result.data || []);
      setMeta(result.meta);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unknown error");
      toast.error("Failed to load vendor items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    fetchCategoryOptions();
  }, [page, debouncedSearch, statusFilter]);

  const handleExport = async () => {
    setExporting(true);
    try {
      // 1. Ambil Token Autentikasi
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      // 2. Kumpulkan Filter
      const exportFilters: ItemExportQuery = {};

      if (startDate) exportFilters.startDate = startDate;
      if (endDate) exportFilters.endDate = endDate;
      // Gunakan statusFilter yang sudah ada, atau buat filter baru khusus export jika perlu
      if (statusFilter !== "ALL")
        exportFilters.isActive = statusFilter as "true" | "false";

      // Tambahkan filter categoryId untuk export
      if (exportCategoryId && exportCategoryId !== "ALL")
        exportFilters.categoryId = exportCategoryId;

      const queryString = new URLSearchParams(
        exportFilters as Record<string, string>
      ).toString();

      // PASTIKAN URL INI SESUAI DENGAN ROUTE BACKEND ANDA!
      const exportUrl = `http://localhost:8000/vendor-items/export/excel?${queryString}`;

      const response = await fetch(exportUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Export failed. Server responded with an error.");
      }

      // 3. Proses File Binary (Blob)
      const blob = await response.blob();
      // Coba ambil nama file dari header, default jika tidak ada
      const filename =
        response.headers
          .get("Content-Disposition")
          ?.match(/filename="(.+)"/)?.[1] || "vendor_items_export.xlsx";

      // Membuat URL objek untuk file yang akan diunduh
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename; // Nama file download
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url); // Bersihkan URL

      toast.success("Data Vendor Items berhasil di-export ke Excel!");
    } catch (error) {
      console.error("Export Error:", error);
      toast.error(
        "Gagal meng-export data. Pastikan filter sudah benar dan Anda memiliki akses."
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4 overflow-x-hidden w-full  mx-auto">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 overflow-x-auto">
          <CardTitle className="text-xl font-semibold whitespace-nowrap">
            Vendor Items Management
          </CardTitle>

          <div className="flex flex-wrap md:flex-nowrap gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64 min-w-[200px]">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search vendor item..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(val) => setStatusFilter(val)}
            >
              <SelectTrigger className="w-[150px] min-w-[150px]">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* --- GARIS PEMISAH --- */}
      <hr />

      {/* === FILTER DAN EXPORT BARU === */}
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          <h3 className="w-full text-sm font-semibold text-muted-foreground">
            Export Filters:
          </h3>

          {/* Filter Category ID untuk Export */}
          <Select value={exportCategoryId} onValueChange={setExportCategoryId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Categories</SelectItem>
              {categoryOptions.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filter Tanggal Mulai */}
          <div className="flex flex-col">
            <label className="text-xs font-medium text-muted-foreground mb-1">
              Start Date
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-[150px]"
            />
          </div>

          {/* Filter Tanggal Akhir */}
          <div className="flex flex-col">
            <label className="text-xs font-medium text-muted-foreground mb-1">
              End Date
            </label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-[150px]"
            />
          </div>

          {/* Tombol Export */}
          <Button
            size="sm"
            className="gap-2 bg-green-600 hover:bg-green-700 ml-auto"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            {exporting ? "Exporting..." : "Export to Excel"}
          </Button>
        </div>
      </Card>
      {/* --- END: FILTER DAN EXPORT BARU --- */}
      <div className="p-1 flex justify-start">
        <Link href="/super-admin/vendor-items/add">
          <Button size="sm" className="gap-2 cursor-pointer">
            + Add Vendor Item
          </Button>
        </Link>
      </div>

      <Card className="w-full">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[280px]">Item Name</TableHead>
                  <TableHead className="min-w-[250px]">Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      {/* Kolom 1: Item Name (w-[250px]) */}
                      <TableCell className="h-12 w-[250px]">
                        <Skeleton className="h-4 w-[200px]" />
                      </TableCell>
                      {/* Kolom 2: Description (min-w-[250px]) */}
                      <TableCell className="h-12 min-w-[250px]">
                        <Skeleton className="h-4 w-[250px]" />
                      </TableCell>
                      {/* Kolom 3: Category */}
                      <TableCell className="h-12">
                        <Skeleton className="h-4 w-[100px]" />
                      </TableCell>
                      {/* Kolom 4: Status */}
                      <TableCell className="h-12">
                        <Skeleton className="h-4 w-[70px]" />
                      </TableCell>
                      {/* Kolom 5: Created */}
                      <TableCell className="h-12">
                        <Skeleton className="h-4 w-[100px]" />
                      </TableCell>
                      {/* Kolom 6: Actions (text-right) */}
                      <TableCell className="h-12 text-right">
                        <div className="flex justify-end space-x-2">
                          <Skeleton className="h-8 w-[50px]" />
                          {/* Edit Button */}
                          <Skeleton className="h-8 w-[60px]" />
                          {/* Delete Button */}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : error ? (
                  /* Penanganan Error */
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-red-500 py-6"
                    >
                      Error: {error || "Gagal memuat item vendor."}
                    </TableCell>
                  </TableRow>
                ) : items.length > 0 ? (
                  /* Menampilkan Data Item (Kode Anda sebelumnya) */
                  items.map((data) => (
                    <TableRow key={data.id}>
                      <TableCell className="font-medium wrap-break-word whitespace-pre-wrap">
                        {data.name}
                      </TableCell>
                      <TableCell className="wrap-break-word whitespace-pre-wrap max-w-[300px]">
                        {data.description}
                      </TableCell>
                      <TableCell>{data.category?.name || "—"}</TableCell>
                      <TableCell>
                        {data.isActive ? (
                          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                            Active
                          </Badge>
                        ) : (
                          <Badge
                            variant="destructive"
                            className="bg-red-500/10 text-red-600 border-red-500/20"
                          >
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {formatDate(data.createdAt, { style: "relative" })}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Link
                          href={`/super-admin/vendor-items/edit/${data.id}`}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="cursor-pointer"
                          >
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="text-xs cursor-pointer"
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  /* Data Kosong */
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-6 text-muted-foreground"
                    >
                      No vendor items found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* === PAGINATION === */}
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
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={!meta.hasNext}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorItems;
