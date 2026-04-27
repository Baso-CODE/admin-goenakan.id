"use client";

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
import { formatDate } from "@/utils/formatDate";
import { FileDown, Loader2, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ConfirmDeleteDialog } from "../../components/confirmDeleteDialog";

type ProductCategories = {
  id: string;
  name?: string;
  name_id?: string;
  name_en?: string;
  slug: string;
  createdAt: string;
};

type Meta = {
  hasNext: boolean;
  hasPrevious: boolean;
  page: number;
  perPage: number;
  total: number;
};

// Interface untuk Query Export
interface CategoryExportQuery {
  startDate?: string;
  endDate?: string;
  search?: string;
}

const ProductCategoriesPage = () => {
  const { fetchApi, status } = useApi();

  // --- STATE UNTUK TABLE ---
  const [categories, setCategories] = useState<ProductCategories[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [page, setPage] = useState(1);

  // --- STATE UNTUK DELETE ---
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- STATE UNTUK EXPORT FILTER ---
  const [exportStartDate, setExportStartDate] = useState<string>("");
  const [exportEndDate, setExportEndDate] = useState<string>("");
  const [exporting, setExporting] = useState<boolean>(false);

  // --- FUNGSI FETCH DATA (Untuk Tabel) ---
  const fetchCategories = async () => {
    if (status !== "authenticated") return;

    setLoading(true);
    setError(null);
    try {
      // 1. Build Query Params
      const params = new URLSearchParams({
        page: page.toString(),
        take: "10",
      });

      if (debouncedSearch.trim()) {
        params.append("search", debouncedSearch.trim());
      }

      // 2. ✨ Gunakan fetchApi (Otomatis handle Base URL dan Token)
      const res = await fetchApi(`/product-categories?${params}`);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `HTTP Error ${res.status}`);
      }

      const result = await res.json();
      setCategories(result.data || []);
      setMeta(result.meta);
    } catch (error) {
      console.error("❌ Load Categories Error:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
      toast.error("Failed to load product categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [page, debouncedSearch, status, fetchApi]);

  // --- FUNGSI HANDLE DELETE ---
  const handleDelete = async () => {
    if (!deleteId || status !== "authenticated") return;

    setIsDeleting(true);
    try {
      // ✨ Gunakan fetchApi (Otomatis handle Base URL dan Token)
      const res = await fetchApi(`/product-categories/${deleteId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        // Parsing error secara aman
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to delete category");
      }

      toast.success("Product Category berhasil dihapus!");
      setDeleteId(null);
      fetchCategories(); // Refresh data tabel
    } catch (error: any) {
      console.error("❌ Delete Error:", error);
      toast.error(
        error.message ||
          "Gagal menghapus Category. Pastikan kategori ini tidak sedang digunakan oleh data produk.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // --- FUNGSI HANDLE EXPORT (Implementasi Baru) ---
  const handleExportCategories = async () => {
    setExporting(true);
    try {
      // 1. Ambil Token Autentikasi

      // 2. Kumpulkan Filter
      const exportFilters: CategoryExportQuery = {
        ...(exportStartDate && { startDate: exportStartDate }),
        ...(exportEndDate && { endDate: exportEndDate }),
      };

      const queryString = new URLSearchParams(
        exportFilters as Record<string, string>,
      ).toString();

      const response = await fetchApi(
        `/product-categories/export/excel?${queryString}`,
        {
          method: "GET",
        },
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.error("❌ Server Error:", errData);
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
        : `product_categories_export_${new Date()
            .toISOString()
            .slice(0, 10)}.xlsx`;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Data Product Categories berhasil di-export ke Excel!");
    } catch (error) {
      console.error("Export Error:", error);
      toast.error("Gagal meng-export data. Pastikan filter tanggal benar.");
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [page, debouncedSearch]);

  return (
    <div className="space-y-4 w-auto mx-auto">
      {/* === HEADER & SEARCH/FILTER TABLE === */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <CardTitle className="text-xl font-semibold">
            Product Categories Management 🏷️
          </CardTitle>

          <div className="flex gap-3 w-full md:w-auto">
            {/* SEARCH */}
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* --- FILTER DAN EXPORT BARU --- */}
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          <h3 className="w-full text-sm font-semibold text-muted-foreground">
            Export Filter (opsional, berdasarkan Created Date):
          </h3>

          <div className="flex flex-col">
            <label className="text-xs font-medium text-muted-foreground mb-1">
              Start Date
            </label>
            <Input
              type="date"
              value={exportStartDate}
              onChange={(e) => setExportStartDate(e.target.value)}
              className="w-37.5"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-medium text-muted-foreground mb-1">
              End Date
            </label>
            <Input
              type="date"
              value={exportEndDate}
              onChange={(e) => setExportEndDate(e.target.value)}
              className="w-37.5"
            />
          </div>

          <Link href="/super-admin/product-categories/add" className="ml-auto">
            <Button size="sm" className="gap-2 cursor-pointer">
              + Add Category
            </Button>
          </Link>

          <Button
            size="sm"
            className="gap-2 bg-green-600 hover:bg-green-700"
            onClick={handleExportCategories}
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
      <Card className="w-full">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {/* 🔄 2. UPDATE: Pisah menjadi kolom ID dan EN */}
                <TableHead className="w-[20%]">Category Name (ID)</TableHead>
                <TableHead className="w-[20%]">Category Name (EN)</TableHead>
                <TableHead className="w-[20%]">Slug</TableHead>
                <TableHead className="w-[20%]">Created</TableHead>
                <TableHead className="w-[20%]">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                /* Skeleton Loader */
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell className="h-12">
                      <Skeleton className="h-4 w-3/4" />
                    </TableCell>
                    <TableCell className="h-12">
                      <Skeleton className="h-4 w-3/4" />
                    </TableCell>
                    <TableCell className="h-12">
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                    <TableCell className="h-12">
                      <Skeleton className="h-4 w-2/3" />
                    </TableCell>
                    <TableCell className="h-12">
                      <div className="flex space-x-2">
                        <Skeleton className="h-8 w-12" />
                        <Skeleton className="h-8 w-16" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : error ? (
                /* Error State */
                <TableRow>
                  {/* 🔄 3. Update colSpan dari 4 menjadi 5 karena ada tambahan kolom */}
                  <TableCell
                    colSpan={5}
                    className="text-center text-red-500 py-6">
                    Error: {"Failed to load categories."}
                  </TableCell>
                </TableRow>
              ) : categories.length > 0 ? (
                /* Data Rendering */
                categories.map((data) => (
                  <TableRow key={data.id}>
                    {/* 🔄 4. Tampilkan Bahasa Indonesia (name_id atau fallback name) */}
                    <TableCell className="font-medium text-gray-900">
                      {data.name_id || data.name || "-"}
                    </TableCell>

                    {/* 🔄 5. Tampilkan Bahasa Inggris (name_en) */}
                    <TableCell className="text-gray-500 italic">
                      {data.name_en || "-"}
                    </TableCell>

                    <TableCell>{data.slug}</TableCell>
                    <TableCell>
                      {formatDate(data.createdAt, { style: "relative" })}
                    </TableCell>
                    <TableCell className="space-x-2">
                      <Link
                        href={`/super-admin/product-categories/edit/${data.id}`}>
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
                        className="text-xs cursor-pointer"
                        onClick={() => setDeleteId(data.id)}>
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                /* Empty State */
                <TableRow>
                  {/* 🔄 3. Update colSpan dari 4 menjadi 5 */}
                  <TableCell
                    colSpan={5}
                    className="text-center py-6 text-muted-foreground">
                    No categories found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* === PAGINATION === */}
      {meta && (
        <div className="flex justify-between items-center p-4 border-t text-sm text-muted-foreground">
          <p className="text-sm text-muted-foreground">
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
        warningMessage="Product Category tidak dapat dihapus jika sudah digunakan dalam data produk. Pastikan tidak ada produk yang menggunakan kategori ini sebelum menghapus."
      />
    </div>
  );
};

export default ProductCategoriesPage;
