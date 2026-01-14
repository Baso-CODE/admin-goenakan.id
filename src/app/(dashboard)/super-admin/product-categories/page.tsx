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
import { formatDate } from "@/utils/formatDate";
import { FileDown, Loader2, Search } from "lucide-react"; // Import ikon baru
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// === Type definitions ===
type ProductCategories = {
  id: string;
  name: string;
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
  search?: string; // Tambahkan search agar bisa memfilter data yang diekspor
}

const ProductCategoriesPage = () => {
  // --- STATE UNTUK TABLE ---
  const [categories, setCategories] = useState<ProductCategories[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [page, setPage] = useState(1);

  // --- STATE UNTUK EXPORT FILTER ---
  const [exportStartDate, setExportStartDate] = useState<string>("");
  const [exportEndDate, setExportEndDate] = useState<string>("");
  const [exporting, setExporting] = useState<boolean>(false); // State untuk loading button export

  // --- FUNGSI FETCH DATA (Untuk Tabel) ---
  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();
      const params = new URLSearchParams({
        page: page.toString(),
        take: "10",
      });

      if (debouncedSearch.trim()) {
        params.append("search", debouncedSearch.trim());
      }

      const res = await fetch(
        `http://localhost:8000/product-categories?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);

      const result = await res.json();
      setCategories(result.data || []);
      setMeta(result.meta);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unknown error");
      toast.error("Failed to load product categories");
    } finally {
      setLoading(false);
    }
  };

  // --- FUNGSI HANDLE EXPORT (Implementasi Baru) ---
  const handleExportCategories = async () => {
    setExporting(true);
    try {
      // 1. Ambil Token Autentikasi
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      // 2. Kumpulkan Filter
      const exportFilters: CategoryExportQuery = {
        ...(exportStartDate && { startDate: exportStartDate }),
        ...(exportEndDate && { endDate: exportEndDate }),
      };

      const queryString = new URLSearchParams(
        exportFilters as Record<string, string>
      ).toString();

      const exportUrl = `http://localhost:8000/product-categories/export/excel?${queryString}`;

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
  // --- END FUNGSI HANDLE EXPORT ---

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
            {/* SEARCH (Untuk Tabel) */}
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
            {/* Tidak ada filter status di sini karena skema tidak memilikinya */}
          </div>
        </CardHeader>
      </Card>

      {/* --- FILTER DAN EXPORT BARU --- */}
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          <h3 className="w-full text-sm font-semibold text-muted-foreground">
            Export Filter (opsional, berdasarkan Created Date):
          </h3>

          {/* Filter Tanggal Mulai (Untuk Export) */}
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

          {/* Filter Tanggal Akhir (Untuk Export) */}
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

          {/* Tombol Add Category */}
          <Link href="/super-admin/product-categories/add" className="ml-auto">
            <Button size="sm" className="gap-2 cursor-pointer">
              + Add Category
            </Button>
          </Link>

          {/* Tombol Export */}
          <Button
            size="sm"
            className="gap-2 bg-green-600 hover:bg-green-700" // Ubah warna untuk membedakan
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
      {/* --- END FILTER DAN EXPORT BARU --- */}

      {/* === TABLE === */}
      <Card className="w-full">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Category Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                /* Penanganan Loading menggunakan Skeleton */
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell className="h-12 w-[30%]">
                      <Skeleton className="h-4 w-37.5" />
                    </TableCell>
                    <TableCell className="h-12 w-[30%]">
                      <Skeleton className="h-4 w-50" />
                    </TableCell>
                    <TableCell className="h-12 w-[20%]">
                      <Skeleton className="h-4 w-25" />
                    </TableCell>
                    <TableCell className="h-12 w-[20%] ">
                      <div className="flex space-x-2">
                        <Skeleton className="h-8 w-[50px]" />
                        <Skeleton className="h-8 w-[60px]" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : error ? (
                /* Penanganan Error */
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-red-500 py-6">
                    Error: {"Failed to load categories."}
                  </TableCell>
                </TableRow>
              ) : categories.length > 0 ? (
                /* Menampilkan Data Category */
                categories.map((data) => (
                  <TableRow key={data.id}>
                    <TableCell className="font-medium">{data.name}</TableCell>
                    <TableCell>{data.slug}</TableCell>
                    <TableCell>
                      {formatDate(data.createdAt, { style: "relative" })}
                    </TableCell>
                    <TableCell className=" space-x-2">
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
                        className="text-xs cursor-pointer">
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                /* Data Kosong */
                <TableRow>
                  <TableCell
                    colSpan={4}
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
    </div>
  );
};

export default ProductCategoriesPage;
