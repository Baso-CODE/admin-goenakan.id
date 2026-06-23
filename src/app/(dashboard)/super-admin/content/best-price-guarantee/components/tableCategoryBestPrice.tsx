"use client";

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
import { FileDown, Loader2, Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type BestPriceCategoryItem = {
  id: number;
  nameId: string;
  nameEn: string;
  slug: string;
  descriptionId: string | null;
  descriptionEn: string | null;
  displayOrder: number;
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

interface ExportQuery {
  startDate?: string;
  endDate?: string;
  isActive?: "true" | "false" | "ALL";
  search?: string;
}

export default function BestPriceCategoryTable() {
  const { fetchApi, status } = useApi();

  // === STATE DATA ===
  const [categories, setCategories] = useState<BestPriceCategoryItem[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);

  // === STATE UI ===
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // === STATE FILTER ===
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [page, setPage] = useState(1);

  // === STATE EXPORT ===
  const [exportStartDate, setExportStartDate] = useState<Date | undefined>(
    undefined,
  );
  const [exportEndDate, setExportEndDate] = useState<Date | undefined>(
    undefined,
  );
  const [exportIsActive, setExportIsActive] = useState<string>("ALL");
  const [exporting, setExporting] = useState<boolean>(false);

  // FETCH DATA CATEGORIES
  const fetchData = async () => {
    if (status !== "authenticated") return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        take: "10",
      });

      if (debouncedSearch.trim())
        params.append("search", debouncedSearch.trim());

      const res = await fetchApi(
        `/content/best-price-guarantee/categories?${params}`,
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `HTTP Error ${res.status}`);
      }

      const result = await res.json();
      setCategories(result.data || []);
      setMeta(result.meta);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      setError(msg);
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, debouncedSearch, status, fetchApi]);

  // HANDLE DELETE
  const handleDelete = async (id: number) => {
    if (!id || status !== "authenticated") return;
    if (
      !confirm(
        "Are you sure you want to delete this category? Make sure no items are using it.",
      )
    )
      return;

    setDeletingId(id);
    try {
      const res = await fetchApi(
        `/content/best-price-guarantee/categories/${id}`,
        {
          method: "DELETE",
        },
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to delete");
      }

      toast.success("Category deleted successfully");
      fetchData();
    } catch (err: any) {
      console.error("❌ Delete Error:", err);
      toast.error(err.message || "Failed to delete category");
    } finally {
      setDeletingId(null);
    }
  };

  // HANDLE EXPORT
  const handleExport = async () => {
    setExporting(true);
    try {
      const exportFilters: ExportQuery = {
        ...(exportStartDate && {
          startDate: format(exportStartDate, "yyyy-MM-dd"),
        }),
        ...(exportEndDate && { endDate: format(exportEndDate, "yyyy-MM-dd") }),
        ...(exportIsActive !== "ALL" && {
          isActive: exportIsActive as "true" | "false",
        }),
        ...(search.trim() && { search: search.trim() }),
      };

      const queryString = new URLSearchParams(
        exportFilters as Record<string, string>,
      ).toString();
      const response = await fetchApi(
        `/content/best-price-guarantee/categories/export/excel?${queryString}`,
        { method: "GET" },
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `best_price_categories_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success("Categories exported successfully!");
    } catch (error) {
      toast.error("Failed to export data.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4 w-auto mx-auto">
      {/* === HEADER === */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <CardTitle className="text-xl font-semibold">
            Best Price Categories Management
          </CardTitle>
          <div className="relative flex-1 md:w-64 md:max-w-xs">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search category name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardHeader>
      </Card>

      {/* === FILTER BAR === */}
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          <h3 className="w-full text-sm font-semibold text-muted-foreground">
            Filters & Actions:
          </h3>

          <div className="flex flex-col">
            <label className="text-xs font-medium text-muted-foreground mb-1">
              Status
            </label>
            <Select value={exportIsActive} onValueChange={setExportIsActive}>
              <SelectTrigger className="w-28">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-medium text-muted-foreground mb-1">
              From
            </label>
            <DatePickerHelper
              date={exportStartDate}
              setDate={setExportStartDate}
              placeholder="Start date"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-medium text-muted-foreground mb-1">
              To
            </label>
            <DatePickerHelper
              date={exportEndDate}
              setDate={setExportEndDate}
              placeholder="End date"
            />
          </div>

          {/* Actions */}
          <Link
            href="/super-admin/content/best-price-guarantee"
            className="ml-auto">
            <Button size="sm" className="gap-2" variant="secondary">
              Back to Items
            </Button>
          </Link>
          <Link href="/super-admin/content/best-price-guarantee/categories/add">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> Add Category
            </Button>
          </Link>
          <Button
            size="sm"
            variant="outline"
            className="gap-2 text-green-600 border-green-600 hover:bg-green-50"
            onClick={handleExport}
            disabled={exporting}>
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            Export
          </Button>
        </div>
      </Card>

      {/* === TABLE === */}
      <Card className="w-full">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name (ID / EN)</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead className="text-center">Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Skeleton className="h-4 w-48 mb-1" />
                      <Skeleton className="h-3 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-8 mx-auto" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-20 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-red-500 py-6">
                    {error}
                  </TableCell>
                </TableRow>
              ) : categories.length > 0 ? (
                categories.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell className="max-w-75">
                      <div className="font-medium truncate" title={cat.nameId}>
                        {cat.nameId}
                      </div>
                      <div
                        className="text-xs text-muted-foreground truncate"
                        title={cat.nameEn}>
                        {cat.nameEn}
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="text-xs font-mono bg-stone-100 px-2 py-1 rounded text-stone-600">
                        {cat.slug}
                      </span>
                    </TableCell>

                    <TableCell className="text-center text-muted-foreground">
                      {cat.displayOrder}
                    </TableCell>

                    <TableCell>
                      {cat.isActive ? (
                        <Badge className="bg-green-500 hover:bg-green-600">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-sm whitespace-nowrap">
                      {formatDate(cat.createdAt)}
                    </TableCell>

                    <TableCell className="text-right space-x-2 whitespace-nowrap">
                      <Link
                        href={`/super-admin/content/best-price-guarantee/categories/edit/${cat.id}`}>
                        <Button variant="outline" size="sm" className="h-8">
                          Edit
                        </Button>
                      </Link>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleDelete(cat.id)}
                        disabled={deletingId === cat.id}>
                        {deletingId === cat.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="h-8 w-8 opacity-20" />
                      <p>No Best Price Guarantee categories found.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* === PAGINATION === */}
      {meta && (
        <div className="flex justify-between items-center p-4 border-t text-sm text-muted-foreground bg-card rounded-md border shadow-sm">
          <p>
            Page {meta.page} of {Math.ceil(meta.total / meta.perPage)} (
            {meta.total} categories)
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
}
