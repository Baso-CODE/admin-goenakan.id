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
import { format } from "date-fns"; // Untuk format tanggal saat export
import { FileDown, Loader2, Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type BestPriceItem = {
  id: number;
  titleId: string;
  titleEn: string;
  contentId: string;
  contentEn: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  category: {
    id: number;
    nameId: string;
    nameEn: string;
  };
};

type CategoryOption = {
  id: number;
  nameId: string;
  nameEn: string;
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
  categoryId?: string;
  search?: string;
}

export default function BestPriceGuaranteeTable() {
  const { fetchApi, status } = useApi();

  // === STATE DATA ===
  const [items, setItems] = useState<BestPriceItem[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);

  // === STATE UI ===
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // === STATE FILTER ===
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 800);
  const [page, setPage] = useState(1);
  const [filterCategoryId, setFilterCategoryId] = useState<string>("ALL");

  // === STATE EXPORT (DIUPDATE KE TIPE DATE) ===
  const [exportStartDate, setExportStartDate] = useState<Date | undefined>(
    undefined,
  );
  const [exportEndDate, setExportEndDate] = useState<Date | undefined>(
    undefined,
  );
  const [exportIsActive, setExportIsActive] = useState<string>("ALL");
  const [exporting, setExporting] = useState<boolean>(false);

  // 1. FETCH CATEGORIES
  useEffect(() => {
    const fetchCategoryList = async () => {
      if (status !== "authenticated") return;
      try {
        const res = await fetchApi(
          "/content/best-price-guarantee/categories/list",
        );
        if (!res.ok) throw new Error("Failed to load categories list");
        const result = await res.json();
        setCategories(result.data || result);
      } catch (err) {
        console.error("❌ Failed to load categories list:", err);
      }
    };
    fetchCategoryList();
  }, [status, fetchApi]);

  // 2. FETCH ITEMS DATA
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
      if (filterCategoryId !== "ALL")
        params.append("categoryId", filterCategoryId);

      const res = await fetchApi(
        `/content/best-price-guarantee/items?${params}`,
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `HTTP Error ${res.status}`);
      }

      const result = await res.json();
      setItems(result.data || []);
      setMeta(result.meta);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      setError(msg);
      toast.error("Failed to load items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, debouncedSearch, filterCategoryId, status, fetchApi]);

  // 3. HANDLE DELETE
  const handleDelete = async (id: number) => {
    if (!id || status !== "authenticated") return;
    if (!confirm("Are you sure you want to delete this item?")) return;

    setDeletingId(id);
    try {
      const res = await fetchApi(`/content/best-price-guarantee/items/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to delete");
      }

      toast.success("Item deleted successfully");
      fetchData();
    } catch (err: any) {
      console.error("❌ Delete Error:", err);
      toast.error(err.message || "Failed to delete item");
    } finally {
      setDeletingId(null);
    }
  };

  // 4. HANDLE EXPORT
  const handleExport = async () => {
    setExporting(true);
    try {
      // Format Date object menjadi string yyyy-MM-dd sebelum dikirim ke API
      const exportFilters: ExportQuery = {
        ...(exportStartDate && {
          startDate: format(exportStartDate, "yyyy-MM-dd"),
        }),
        ...(exportEndDate && { endDate: format(exportEndDate, "yyyy-MM-dd") }),
        ...(exportIsActive !== "ALL" && {
          isActive: exportIsActive as "true" | "false",
        }),
        ...(filterCategoryId !== "ALL" && { categoryId: filterCategoryId }),
        ...(search.trim() && { search: search.trim() }),
      };

      const queryString = new URLSearchParams(
        exportFilters as Record<string, string>,
      ).toString();
      const response = await fetchApi(
        `/content/best-price-guarantee/items/export/excel?${queryString}`,
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
      a.download = `best_price_guarantee_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success("Items exported successfully!");
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
            Best Price Guarantee Items
          </CardTitle>
          <div className="relative flex-1 md:w-64 md:max-w-xs">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search title or content..."
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
              Category
            </label>
            <Select
              value={filterCategoryId}
              onValueChange={setFilterCategoryId}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.nameId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* === COMPONENT DATE PICKER HELPER === */}
          <div className="flex flex-col">
            <label className="text-xs font-medium text-muted-foreground mb-1">
              From
            </label>
            <DatePickerHelper
              date={exportStartDate}
              setDate={setExportStartDate}
              placeholder="Pick a start date"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-medium text-muted-foreground mb-1">
              To
            </label>
            <DatePickerHelper
              date={exportEndDate}
              setDate={setExportEndDate}
              placeholder="Pick an end date"
            />
          </div>

          {/* Actions */}
          <Link
            href="/super-admin/content/best-price-guarantee/categories"
            className="ml-auto">
            <Button size="sm" className="gap-2" variant="secondary">
              Categories
            </Button>
          </Link>
          <Link href="/super-admin/content/best-price-guarantee/add">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> Add Item
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
                <TableHead>Title (ID / EN)</TableHead>
                <TableHead>Category</TableHead>
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
                      <Skeleton className="h-6 w-24 rounded-full" />
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
              ) : items.length > 0 ? (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="max-w-75">
                      <div
                        className="font-medium truncate"
                        title={item.titleId}>
                        {item.titleId}
                      </div>
                      <div
                        className="text-xs text-muted-foreground truncate"
                        title={item.contentId.replace(/<[^>]*>?/gm, "")}>
                        {item.contentId
                          .replace(/<[^>]*>?/gm, "")
                          .substring(0, 50)}
                        ...
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="outline"
                        className="whitespace-nowrap bg-blue-50 text-blue-700 border-blue-200">
                        {item.category.nameId}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-center text-muted-foreground">
                      {item.displayOrder}
                    </TableCell>

                    <TableCell>
                      {item.isActive ? (
                        <Badge className="bg-green-500 hover:bg-green-600">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-sm whitespace-nowrap">
                      {formatDate(item.createdAt)}
                    </TableCell>

                    <TableCell className="text-right space-x-2 whitespace-nowrap">
                      <Link
                        href={`/super-admin/content/best-price-guarantee/items/edit/${item.id}`}>
                        <Button variant="outline" size="sm" className="h-8">
                          Edit
                        </Button>
                      </Link>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}>
                        {deletingId === item.id ? (
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
                      <p>No Best Price Guarantee items found.</p>
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
            {meta.total} items)
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
