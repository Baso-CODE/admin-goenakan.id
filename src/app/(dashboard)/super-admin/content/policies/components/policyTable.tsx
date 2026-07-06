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

type PolicyItem = {
  id: number;
  titleId: string;
  titleEn: string;
  contentId: string;
  contentEn: string;
  isActive: boolean;
  displayOrder: number;
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

interface PolicyExportQuery {
  startDate?: string;
  endDate?: string;
  isActive?: "true" | "false" | "ALL";
  categoryId?: string;
  search?: string;
}

export default function PolicyTable() {
  const { fetchApi, status } = useApi();

  // === STATE DATA ===
  const [policies, setPolicies] = useState<PolicyItem[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);

  // === STATE UI ===
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // === STATE FILTER ===
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [page, setPage] = useState(1);

  // Filter Khusus
  const [filterCategoryId, setFilterCategoryId] = useState<string>("ALL");

  // === STATE EXPORT ===
  const [exportStartDate, setExportStartDate] = useState<string>("");
  const [exportEndDate, setExportEndDate] = useState<string>("");
  const [exportIsActive, setExportIsActive] = useState<string>("ALL");
  const [exporting, setExporting] = useState<boolean>(false);

  // 1. FETCH CATEGORIES (Untuk Dropdown Filter)
  useEffect(() => {
    const fetchCategoryList = async () => {
      if (status !== "authenticated") return;

      try {
        // Asumsi endpoint list category policy Anda
        const res = await fetchApi("/content/policies/categories");

        if (!res.ok) throw new Error("Failed to load categories list");

        const result = await res.json();
        setCategories(result.data || []);
      } catch (err) {
        console.error("❌ Failed to load categories list:", err);
      }
    };

    fetchCategoryList();
  }, [status, fetchApi]);

  // 2. FETCH POLICIES (Main Data)
  const fetchPolicies = async () => {
    if (status !== "authenticated") return;

    setLoading(true);
    setError(null);

    try {
      // Build Query Params
      const params = new URLSearchParams({
        page: page.toString(),
        take: "10",
      });

      if (debouncedSearch.trim())
        params.append("search", debouncedSearch.trim());
      if (filterCategoryId !== "ALL")
        params.append("categoryId", filterCategoryId);

      const res = await fetchApi(`/content/policies/items?${params}`);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `HTTP Error ${res.status}`);
      }

      const result = await res.json();
      setPolicies(result.data || []);
      setMeta(result.meta);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      setError(msg);
      toast.error("Failed to load Policies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, [page, debouncedSearch, filterCategoryId, status, fetchApi]);

  // 3. HANDLE DELETE
  const handleDelete = async (id: number) => {
    if (!id || status !== "authenticated") return;

    if (!confirm("Are you sure you want to delete this Policy?")) return;

    setDeletingId(id);
    try {
      const res = await fetchApi(`/content/policies/items/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to delete");
      }

      toast.success("Policy deleted successfully");
      fetchPolicies();
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
      const exportFilters: PolicyExportQuery = {
        ...(exportStartDate && { startDate: exportStartDate }),
        ...(exportEndDate && { endDate: exportEndDate }),
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
        `/content/policies/items/export/excel?${queryString}`,
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
      a.download = `policy_items_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success("Policies exported successfully!");
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
            Policy Items Management
          </CardTitle>
          <div className="relative flex-1 md:w-64 md:max-w-xs">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search policy title..."
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

          {/* Filter 1: Status */}
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

          {/* Filter 2: Category */}
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

          {/* Filter 3: Date Range */}
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

          {/* Actions */}
          <Link
            href="/super-admin/content/policies/categories"
            className="ml-auto">
            <Button size="sm" className="gap-2" variant={"secondary"}>
              Category Policy
            </Button>
          </Link>
          <Link href="/super-admin/content/policies/add" className="">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> Add Policy
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
                      <Skeleton className="h-4 w-64 mb-1" />
                      <Skeleton className="h-3 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-24 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-8 mx-auto" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
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
              ) : policies.length > 0 ? (
                policies.map((policy) => (
                  <TableRow key={policy.id}>
                    {/* Title (ID & EN) */}
                    <TableCell className="max-w-75">
                      <div
                        className="font-medium truncate"
                        title={policy.titleId}>
                        {policy.titleId}
                      </div>
                      <div
                        className="text-xs text-muted-foreground truncate"
                        title={policy.titleEn}>
                        {policy.titleEn}
                      </div>
                    </TableCell>

                    {/* Category */}
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="whitespace-nowrap bg-blue-50 text-blue-700 border-blue-200">
                        {policy.category.nameId}
                      </Badge>
                    </TableCell>

                    {/* Display Order */}
                    <TableCell className="text-center text-muted-foreground">
                      {policy.displayOrder}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      {policy.isActive ? (
                        <Badge className="bg-green-500 hover:bg-green-600">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>

                    {/* Date */}
                    <TableCell className="text-sm whitespace-nowrap">
                      {formatDate(policy.createdAt)}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right space-x-2 whitespace-nowrap">
                      <Link
                        href={`/super-admin/content/policies/edits/${policy.id}`}>
                        <Button variant="outline" size="sm" className="h-8">
                          Edit
                        </Button>
                      </Link>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleDelete(policy.id)}
                        disabled={deletingId === policy.id}>
                        {deletingId === policy.id ? (
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
                    colSpan={6} // Diubah jadi 6 menyesuaikan jumlah kolom
                    className="text-center py-8 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="h-8 w-8 opacity-20" />
                      <p>No Policy items found.</p>
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
