"use client";

import { ConfirmDeleteDialog } from "@/app/(dashboard)/components/confirmDeleteDialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { cn } from "@/lib/utils";
import { formatDate } from "@/utils/formatDate";
import { format } from "date-fns";
import { CalendarIcon, FileDown, Loader2, Search } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

// === Type definitions ===
type ArticleCategory = {
  id: string;
  slug: string;
  // Properti baru sesuai schema dua bahasa
  name_id: string;
  description_id: string | null;
  name_en: string | null;
  description_en: string | null;
  isActive: boolean;
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

const ArticleCategories = () => {
  const { fetchApi, status } = useApi();
  // --- STATE UNTUK TABLE ---
  const [categories, setCategories] = useState<ArticleCategory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 800);
  const [page, setPage] = useState(1);

  // --- STATE UNTUK DELETE ---
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- STATE UNTUK EXPORT FILTER ---
  const [exportStartDate, setExportStartDate] = useState<string>("");
  const [exportEndDate, setExportEndDate] = useState<string>("");
  const [exporting, setExporting] = useState<boolean>(false);

  // --- FUNGSI FETCH DATA (Untuk Tabel) ---
  const fetchCategories = useCallback(async () => {
    if (status === "loading" || status === "unauthenticated") return;

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        take: "10",
      });

      if (debouncedSearch.trim()) {
        params.append("search", debouncedSearch.trim());
      }

      //  3. Panggil API tanpa fetch token manual
      const res = await fetchApi(`/article-categories?${params}`);

      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);

      const result = await res.json();
      setCategories(result.data || []);
      setMeta(result.meta);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unknown error");
      toast.error("Failed to load article categories");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, status, fetchApi]);

  // --- FUNGSI HANDLE DELETE ---
  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      //  4. DELETE menggunakan fetchApi
      const res = await fetchApi(`/article-categories/${deleteId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to delete category");
      }

      toast.success("Article Category berhasil dihapus!");
      setDeleteId(null);
      fetchCategories();
    } catch (error) {
      console.error("Delete Error:", error);
      toast.error(
        "Gagal menghapus Category. Pastikan kategori ini tidak sedang digunakan oleh artikel.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // --- FUNGSI HANDLE EXPORT ---
  const handleExportCategories = async () => {
    if (status !== "authenticated") return;

    setExporting(true);
    try {
      const exportFilters = {
        ...(exportStartDate && { startDate: exportStartDate }),
        ...(exportEndDate && { endDate: exportEndDate }),
      };

      const queryString = new URLSearchParams(
        exportFilters as Record<string, string>,
      ).toString();

      //  5. Export menggunakan fetchApi
      const response = await fetchApi(
        `/article-categories/export/excel?${queryString}`,
      );

      if (!response.ok) {
        throw new Error("Export failed. Server responded with an error.");
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("Content-Disposition");

      const filenameMatch = contentDisposition?.match(/filename="(.+?)"/i);
      const filename = filenameMatch
        ? filenameMatch[1]
        : `article_categories_export_${new Date().toISOString().slice(0, 10)}.xlsx`;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Data Article Categories berhasil di-export!");
    } catch (error) {
      console.error("Export Error:", error);
      toast.error("Gagal meng-export data.");
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
            Article Categories Management 📝
          </CardTitle>

          <div className="flex gap-3 w-full md:w-auto">
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
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-50 justify-start text-left font-normal",
                    !exportStartDate && "text-muted-foreground",
                  )}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {exportStartDate ? (
                    format(exportStartDate, "PPP")
                  ) : (
                    <span>Pilih tanggal mulai</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={
                    exportStartDate ? new Date(exportStartDate) : undefined
                  }
                  onSelect={(date) =>
                    setExportStartDate(
                      date ? date.toISOString().split("T")[0] : "",
                    )
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-medium text-muted-foreground mb-1">
              End Date
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-50 justify-start text-left font-normal",
                    !exportEndDate && "text-muted-foreground",
                  )}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {exportEndDate ? (
                    format(exportEndDate, "PPP")
                  ) : (
                    <span>Pilih tanggal akhir</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={exportEndDate ? new Date(exportEndDate) : undefined}
                  onSelect={(date) =>
                    setExportEndDate(
                      date ? date.toISOString().split("T")[0] : "",
                    )
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <Link href="/admin-article/categories/add" className="ml-auto">
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
                <TableHead className="w-[20%]">Category Name</TableHead>
                <TableHead className="w-[30%]">Description</TableHead>
                <TableHead className="w-[10%]">Status</TableHead>
                <TableHead className="w-[20%]">Created</TableHead>
                <TableHead className="w-[20%]">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell className="h-12">
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell className="h-12">
                      <Skeleton className="h-4 w-48" />
                    </TableCell>
                    <TableCell className="h-12">
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell className="h-12">
                      <Skeleton className="h-4 w-24" />
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
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-red-500 py-6">
                    Error: {"Failed to load categories."}
                  </TableCell>
                </TableRow>
              ) : categories.length > 0 ? (
                categories.map((data) => (
                  <TableRow key={data.id}>
                    {/* TAMPILAN NAMA BILINGUAL */}
                    <TableCell className="font-medium align-top">
                      <div className="text-slate-900">{data.name_id}</div>
                      {data.name_en && (
                        <div className="text-[11px] font-normal text-slate-500 uppercase mt-0.5">
                          {data.name_en}
                        </div>
                      )}
                      <div className="text-xs text-blue-600/80 mt-1">
                        {data.slug}
                      </div>
                    </TableCell>

                    {/* TAMPILAN DESKRIPSI BILINGUAL */}
                    <TableCell className="text-sm align-top">
                      <div className="flex flex-col gap-1.5">
                        <div className="text-xs text-slate-700 line-clamp-2">
                          <span className="font-semibold text-slate-400 mr-1">
                            ID:
                          </span>
                          {data.description_id || "-"}
                        </div>
                        {data.description_en && (
                          <div className="text-xs text-slate-500 line-clamp-2">
                            <span className="font-semibold text-slate-400 mr-1">
                              EN:
                            </span>
                            {data.description_en}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="align-top">
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${data.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                        {data.isActive ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="align-top">
                      {formatDate(data.createdAt, { style: "relative" })}
                    </TableCell>
                    <TableCell className="space-x-2 align-top">
                      <Link href={`/admin-article/categories/edit/${data.id}`}>
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
                <TableRow>
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
            Page {meta.page} of {Math.ceil(meta.total / meta.perPage) || 1}
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
        warningMessage="Article Category tidak dapat dihapus jika sudah digunakan dalam data artikel. Pastikan tidak ada artikel yang menggunakan kategori ini sebelum menghapus."
      />
    </div>
  );
};

export default ArticleCategories;
