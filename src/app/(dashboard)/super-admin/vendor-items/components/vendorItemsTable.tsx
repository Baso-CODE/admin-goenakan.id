"use client";

import { ConfirmDeleteDialog } from "@/app/(dashboard)/components/confirmDeleteDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { formatDate } from "@/utils/formatDate";
import { format } from "date-fns";
import { FileDown, Loader2, Package, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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
const VendorItemsTable = () => {
  const { fetchApi, status } = useApi();

  const [items, setItems] = useState<VendorItem[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [categoryOptions, setCategoryOptions] = useState<
    VendorCategoryOption[]
  >([]);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  // === FETCH CATEGORY OPTIONS ===
  const fetchCategoryOptions = async () => {
    if (status !== "authenticated") return;
    try {
      const res = await fetchApi("/vendor-categories?take=1000&isActive=true");
      if (!res.ok) throw new Error("Gagal mengambil kategori");
      const result = await res.json();
      setCategoryOptions(
        result.data.map((cat: any) => ({ id: cat.id, name: cat.name })) || [],
      );
    } catch (error) {
      console.error("Failed to fetch category options:", error);
    }
  };

  // === FETCH ITEMS ===
  const fetchItems = async () => {
    if (status !== "authenticated") return;

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        take: "10",
        isActive: statusFilter,
        categoryId: categoryFilter, // Ditambahkan ke fetch tabel
      });

      if (debouncedSearch.trim())
        params.append("search", debouncedSearch.trim());

      // Tambahkan filter tanggal ke API tabel
      if (startDate)
        params.append("startDate", format(startDate, "yyyy-MM-dd"));
      if (endDate) params.append("endDate", format(endDate, "yyyy-MM-dd"));

      const res = await fetchApi(`/vendor-items?${params}`);
      const result = await res.json();

      if (!res.ok)
        throw new Error(result.message || "Failed to load vendor items");

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
    fetchCategoryOptions();
  }, [status]);

  useEffect(() => {
    fetchItems();
  }, [
    page,
    debouncedSearch,
    statusFilter,
    categoryFilter,
    startDate,
    endDate,
    status,
  ]);

  // === HANDLE EXPORT ===
  const handleExport = async () => {
    setExporting(true);
    try {
      const exportFilters: Record<string, string> = {};

      if (startDate) exportFilters.startDate = format(startDate, "yyyy-MM-dd");
      if (endDate) exportFilters.endDate = format(endDate, "yyyy-MM-dd");
      if (statusFilter !== "ALL") exportFilters.isActive = statusFilter;
      if (categoryFilter !== "ALL") exportFilters.categoryId = categoryFilter;
      if (debouncedSearch.trim()) exportFilters.search = debouncedSearch.trim();

      const queryString = new URLSearchParams(exportFilters).toString();

      const response = await fetchApi(
        `/vendor-items/export/excel?${queryString}`,
        {
          method: "GET",
        },
      );

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vendor_items_export_${format(new Date(), "yyyyMMdd")}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Data Vendor Items berhasil di-export!");
    } catch (error) {
      toast.error("Gagal meng-export data.");
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const response = await fetchApi(`/vendor-items/${deleteId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Gagal menghapus item vendor");
      }
      toast.success("Item berhasil dihapus");
      setPage(1);
      fetchItems();
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan saat menghapus data");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-4 overflow-x-hidden w-full  mx-auto">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <CardTitle className="text-2xl font-bold whitespace-nowrap flex items-center gap-2">
            <Package className="h-7 w-7" />
            Vendor Items Management
          </CardTitle>

          <div className="flex gap-2 ml-auto">
            <Link href="/super-admin/vendor-items/add">
              <Button size="sm" className="gap-2 cursor-pointer">
                + Add Vendor Item
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
              {exporting ? "Exporting..." : "Export Excel"}
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Baris Filter Terpadu - Rata Bawah (items-end) */}
          <div className="flex flex-wrap items-end gap-3">
            {/* Search */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-muted-foreground font-semibold uppercase px-1">
                Search Item
              </label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Name or SKU..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-8 w-60 h-10"
                />
              </div>
            </div>

            {/* Category */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-muted-foreground font-semibold uppercase px-1">
                Category
              </label>
              <Select
                value={categoryFilter}
                onValueChange={(val) => {
                  setCategoryFilter(val);
                  setPage(1);
                }}>
                <SelectTrigger className="w-48 h-10">
                  <SelectValue placeholder="Category" />
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
            </div>

            {/* Status */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-muted-foreground font-semibold uppercase px-1">
                Status
              </label>
              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val);
                  setPage(1);
                }}>
                <SelectTrigger className="w-32 h-10">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-muted-foreground font-semibold uppercase px-1">
                Date Range
              </label>
              <div className="flex items-center gap-2">
                <DatePickerHelper
                  date={startDate}
                  setDate={(date) => {
                    setStartDate(date);
                    setPage(1);
                  }}
                  placeholder="Start Date"
                />
                <span className="text-muted-foreground">-</span>
                <DatePickerHelper
                  date={endDate}
                  setDate={(date) => {
                    setEndDate(date);
                    setPage(1);
                  }}
                  placeholder="End Date"
                />
              </div>
            </div>

            {/* Clear Filter */}
            {(startDate ||
              endDate ||
              statusFilter !== "ALL" ||
              categoryFilter !== "ALL" ||
              search) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStartDate(undefined);
                  setEndDate(undefined);
                  setStatusFilter("ALL");
                  setCategoryFilter("ALL");
                  setSearch("");
                  setPage(1);
                }}
                className="h-10 text-muted-foreground hover:text-red-600">
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-70">Item Name</TableHead>
                  <TableHead className="min-w-62.5">Description</TableHead>
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
                      {/* Kolom 1: Item Name (w-62.5) */}
                      <TableCell className="h-12 w-62.5">
                        <Skeleton className="h-4 w-50" />
                      </TableCell>
                      {/* Kolom 2: Description (min-w-62.5) */}
                      <TableCell className="h-12 min-w-62.5">
                        <Skeleton className="h-4 w-62.5" />
                      </TableCell>
                      {/* Kolom 3: Category */}
                      <TableCell className="h-12">
                        <Skeleton className="h-4 w-25" />
                      </TableCell>
                      {/* Kolom 4: Status */}
                      <TableCell className="h-12">
                        <Skeleton className="h-4 w-17.5" />
                      </TableCell>
                      {/* Kolom 5: Created */}
                      <TableCell className="h-12">
                        <Skeleton className="h-4 w-25" />
                      </TableCell>
                      {/* Kolom 6: Actions (text-right) */}
                      <TableCell className="h-12 text-right">
                        <div className="flex justify-end space-x-2">
                          <Skeleton className="h-8 w-12.5" />
                          {/* Edit Button */}
                          <Skeleton className="h-8 w-15" />
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
                      className="text-center text-red-500 py-6">
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
                      <TableCell className="wrap-break-word whitespace-pre-wrap max-w-75">
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
                            className="bg-red-500/10 text-red-600 border-red-500/20">
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {formatDate(data.createdAt, { style: "relative" })}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Link
                          href={`/super-admin/vendor-items/edit/${data.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="cursor-pointer">
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="text-xs"
                          onClick={() => setDeleteId(data.id)}>
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
                      className="text-center py-6 text-muted-foreground">
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

      <ConfirmDeleteDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        warningMessage="Item tidak dapat dihapus jika sudah digunakan pada data Vendor."
      />
    </div>
  );
};

export default VendorItemsTable;
