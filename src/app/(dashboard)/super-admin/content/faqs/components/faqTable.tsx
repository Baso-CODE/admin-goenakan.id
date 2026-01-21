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
import { apiUrl } from "@/helper/apiurl";
import { useDebounce } from "@/helper/debounce";
import { formatDate } from "@/utils/formatDate";
import { FileDown, Loader2, Plus, Search, Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// ✅ Type Definitions
type FaqItem = {
  id: string;
  question: string;
  answer: string;
  isFeatured: boolean;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  category: {
    id: string;
    name: string;
  };
};

type CategoryOption = {
  id: string;
  name: string;
};

type Meta = {
  hasNext: boolean;
  hasPrevious: boolean;
  page: number;
  perPage: number;
  total: number;
};

interface FaqExportQuery {
  startDate?: string;
  endDate?: string;
  isActive?: "true" | "false" | "ALL";
  categoryId?: string;
  search?: string;
}

export default function FaqTable() {
  // === STATE DATA ===
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]); // Untuk Dropdown Filter
  const [meta, setMeta] = useState<Meta | null>(null);

  // === STATE UI ===
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
      try {
        const tokenRes = await fetch("/api/auth/token");
        const { token } = await tokenRes.json();
        const res = await fetch(`${apiUrl}/content/faqs/categories/list`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await res.json();
        setCategories(result);
      } catch (err) {
        console.error("Failed to load categories list");
      }
    };
    fetchCategoryList();
  }, []);

  // 2. FETCH FAQS (Main Data)
  const fetchFaqs = async () => {
    setLoading(true);
    setError(null);

    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      const params = new URLSearchParams({
        page: page.toString(),
        take: "10",
      });

      if (debouncedSearch.trim())
        params.append("search", debouncedSearch.trim());
      if (filterCategoryId !== "ALL")
        params.append("categoryId", filterCategoryId);

      const res = await fetch(`${apiUrl}/content/faqs/items?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);

      const result = await res.json();
      setFaqs(result.data || []);
      setMeta(result.meta);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unknown error");
      toast.error("Failed to load FAQs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, [page, debouncedSearch, filterCategoryId]); // Re-fetch saat filter berubah

  // 3. HANDLE DELETE
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this FAQ?")) return;
    setDeletingId(id);
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();
      const res = await fetch(`${apiUrl}/content/faqs/items/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to delete");
      toast.success("FAQ deleted successfully");
      fetchFaqs();
    } catch (err) {
      toast.error("Failed to delete item");
    } finally {
      setDeletingId(null);
    }
  };

  // 4. HANDLE EXPORT
  const handleExport = async () => {
    setExporting(true);
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      const exportFilters: FaqExportQuery = {
        ...(exportStartDate && { startDate: exportStartDate }),
        ...(exportEndDate && { endDate: exportEndDate }),
        ...(exportIsActive !== "ALL" && {
          isActive: exportIsActive as "true" | "false",
        }),
        ...(filterCategoryId !== "ALL" && { categoryId: filterCategoryId }), // Include Category Filter
        ...(search.trim() && { search: search.trim() }),
      };

      const queryString = new URLSearchParams(
        exportFilters as Record<string, string>,
      ).toString();
      const exportUrl = `${apiUrl}/content/faqs/items/export/excel?${queryString}`;

      const response = await fetch(exportUrl, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `faq_items_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success("FAQs exported successfully!");
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
            FAQ Items Management
          </CardTitle>
          <div className="relative flex-1 md:w-64 md:max-w-xs">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search question..."
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

          {/* Filter 2: Category (Dynamic) */}
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
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
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
          <Link href="/super-admin/faqs/items/add" className="ml-auto">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> Add FAQ
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
                <TableHead className="w-[50px] text-center">Featured</TableHead>
                <TableHead>Question</TableHead>
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
                      <Skeleton className="h-4 w-4 mx-auto" />
                    </TableCell>
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
                    colSpan={7}
                    className="text-center text-red-500 py-6">
                    {error}
                  </TableCell>
                </TableRow>
              ) : faqs.length > 0 ? (
                faqs.map((faq) => (
                  <TableRow key={faq.id}>
                    {/* Featured Star */}
                    <TableCell className="text-center">
                      {faq.isFeatured && (
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 mx-auto" />
                      )}
                    </TableCell>

                    {/* Question (Main) */}
                    <TableCell className="max-w-[300px]">
                      <div
                        className="font-medium truncate"
                        title={faq.question}>
                        {faq.question}
                      </div>
                      <div
                        className="text-xs text-muted-foreground truncate"
                        title={faq.answer.replace(/<[^>]*>?/gm, "")}>
                        {faq.answer.replace(/<[^>]*>?/gm, "").substring(0, 50)}
                        ...
                      </div>
                    </TableCell>

                    {/* Category */}
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="whitespace-nowrap bg-blue-50 text-blue-700 border-blue-200">
                        {faq.category.name}
                      </Badge>
                    </TableCell>

                    {/* Display Order */}
                    <TableCell className="text-center text-muted-foreground">
                      {faq.displayOrder}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      {faq.isActive ? (
                        <Badge className="bg-green-500 hover:bg-green-600">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>

                    {/* Date */}
                    <TableCell className="text-sm whitespace-nowrap">
                      {formatDate(faq.createdAt)}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right space-x-2 whitespace-nowrap">
                      <Link href={`/super-admin/faqs/items/edit/${faq.id}`}>
                        <Button variant="outline" size="sm" className="h-8">
                          Edit
                        </Button>
                      </Link>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleDelete(faq.id)}
                        disabled={deletingId === faq.id}>
                        {deletingId === faq.id ? (
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
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="h-8 w-8 opacity-20" />
                      <p>No FAQ items found.</p>
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
