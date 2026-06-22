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

import { useDebounce } from "@/helper/debounce";
import { useApi } from "@/hooks/useApi";
import { formatDate } from "@/utils/formatDate";

import { FileDown, Loader2, Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// === TYPE DEFINITIONS ===
type PolicyCategory = {
  id: number;
  nameId: string;
  nameEn: string;
  slug: string;
  descriptionId?: string;
  descriptionEn?: string;
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

interface PolicyCategoryExportQuery {
  startDate?: string;
  endDate?: string;
  isActive?: "true" | "false" | "ALL";
  search?: string;
}

export default function PolicyCategoryTable() {
  const { fetchApi, status } = useApi();

  const [categories, setCategories] = useState<PolicyCategory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);

  // Search State
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [page, setPage] = useState(1);

  // Export & Delete State
  const [exportStartDate, setExportStartDate] = useState<string>("");
  const [exportEndDate, setExportEndDate] = useState<string>("");
  const [exportIsActive, setExportIsActive] = useState<string>("ALL");
  const [exporting, setExporting] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // === 1. FETCH DATA ===
  const fetchCategories = async () => {
    if (status !== "authenticated") return;

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

      const res = await fetchApi(`/content/policies/categories?${params}`);

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
      toast.error("Failed to load policy categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [page, debouncedSearch, status, fetchApi]);

  // === 2. EXPORT EXCEL ===
  const handleExport = async () => {
    setExporting(true);
    try {
      const exportFilters: PolicyCategoryExportQuery = {
        ...(exportStartDate && { startDate: exportStartDate }),
        ...(exportEndDate && { endDate: exportEndDate }),
        ...(exportIsActive !== "ALL" && {
          isActive: exportIsActive as "true" | "false",
        }),
        ...(search.trim() && { search: search.trim() }),
      };

      const queryString = new URLSearchParams(
        exportFilters as Record<string, string>,
      ).toString();

      const response = await fetchApi(
        `/content/policies/categories/export/excel?${queryString}`,
        { method: "GET" },
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Export failed");
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename="(.+?)"/i);
      const filename = filenameMatch
        ? filenameMatch[1]
        : `policy_categories_export_${new Date().toISOString().slice(0, 10)}.xlsx`;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Policy Categories exported successfully!");
    } catch (error) {
      console.error("Export Error:", error);
      toast.error("Failed to export data.");
    } finally {
      setExporting(false);
    }
  };

  // === 3. DELETE HANDLER ===
  const handleDelete = async (id: number) => {
    if (!id || status !== "authenticated") return;

    if (!confirm("Are you sure you want to delete this policy category?"))
      return;

    setDeletingId(id);
    try {
      const res = await fetchApi(`/content/policies/categories/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to delete category");
      }

      toast.success("Category deleted successfully");
      fetchCategories();
    } catch (error: any) {
      console.error("❌ Error delete category:", error);
      toast.error(error.message || "Failed to delete category");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4 w-auto mx-auto">
      {/* === HEADER === */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <CardTitle className="text-xl font-semibold">
            Policy Category Management
          </CardTitle>

          <div className="flex gap-3 w-full md:w-auto">
            {/* SEARCH */}
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search category name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* --- FILTER DAN EXPORT --- */}
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          <h3 className="w-full text-sm font-semibold text-muted-foreground">
            Filters & Actions:
          </h3>

          {/* Filter Status */}
          <div className="flex flex-col">
            <label className="text-xs font-medium text-muted-foreground mb-1">
              Status
            </label>
            <Select value={exportIsActive} onValueChange={setExportIsActive}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Start Date */}
          <div className="flex flex-col">
            <label className="text-xs font-medium text-muted-foreground mb-1">
              From
            </label>
            <Input
              type="date"
              value={exportStartDate}
              onChange={(e) => setExportStartDate(e.target.value)}
              className="w-auto"
            />
          </div>

          {/* End Date */}
          <div className="flex flex-col">
            <label className="text-xs font-medium text-muted-foreground mb-1">
              To
            </label>
            <Input
              type="date"
              value={exportEndDate}
              onChange={(e) => setExportEndDate(e.target.value)}
              className="w-auto"
            />
          </div>

          {/* Add Button */}
          <Link
            href="/super-admin/content/policies/categories/add"
            className="ml-auto">
            <Button size="sm" className="gap-2 cursor-pointer">
              <Plus className="h-4 w-4" /> Add Category
            </Button>
          </Link>

          {/* Export Button */}
          <Button
            size="sm"
            variant="outline"
            className="gap-2 border-green-600 text-green-600 hover:bg-green-50"
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
      </Card>

      {/* === TABLE === */}
      <Card className="w-full">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12.5 text-center">Order</TableHead>
                <TableHead className="min-w-50">Name (ID / EN)</TableHead>
                <TableHead className="hidden md:table-cell">
                  Description
                </TableHead>
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
                      <Skeleton className="h-4 w-8 mx-auto" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-24" />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Skeleton className="h-8 w-12" />
                        <Skeleton className="h-8 w-8" />
                      </div>
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
                    {/* Order */}
                    <TableCell className="font-medium text-center">
                      <Badge variant="outline" className="bg-slate-50">
                        {cat.displayOrder}
                      </Badge>
                    </TableCell>

                    {/* Name (ID & EN) & Slug */}
                    <TableCell>
                      <div className="font-semibold">{cat.nameId}</div>
                      <div className="text-xs text-muted-foreground mb-1">
                        {cat.nameEn}
                      </div>
                      <Badge
                        variant="secondary"
                        className="text-[10px] font-normal px-1.5 py-0">
                        {cat.slug}
                      </Badge>
                    </TableCell>

                    {/* Description */}
                    <TableCell
                      className="hidden md:table-cell max-w-50 truncate text-muted-foreground"
                      title={cat.descriptionId}>
                      {cat.descriptionId || "-"}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      {cat.isActive ? (
                        <Badge className="bg-green-500 hover:bg-green-600">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>

                    {/* Date */}
                    <TableCell className="text-sm whitespace-nowrap">
                      {formatDate(cat.createdAt)}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right space-x-2 whitespace-nowrap">
                      <Link
                        href={`/super-admin/content/policies/categories/edit/${cat.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="cursor-pointer h-8">
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
                      <p>No policy categories found.</p>
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
