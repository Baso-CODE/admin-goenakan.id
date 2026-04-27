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
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// === Type Definitions ===
type HeroSlide = {
  id: string;
  title: string;
  imageUrl: string;
  altText?: string;
  ctaText?: string;
  ctaLink?: string;
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

interface HeroExportQuery {
  startDate?: string;
  endDate?: string;
  isActive?: "true" | "false" | "ALL";
  search?: string;
}

export default function HeroTable() {
  const { fetchApi, status } = useApi();

  // === STATE DATA ===
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // === FILTER STATE ===
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);

  // === EXPORT STATE ===
  const [exportStartDate, setExportStartDate] = useState<string>("");
  const [exportEndDate, setExportEndDate] = useState<string>("");
  const [exportIsActive, setExportIsActive] = useState<string>("ALL");
  const [exporting, setExporting] = useState<boolean>(false);

  // === FETCH DATA ===
  const fetchSlides = async () => {
    if (status !== "authenticated") return;

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        take: "10",
        isActive: statusFilter,
      });

      if (debouncedSearch.trim()) {
        params.append("search", debouncedSearch.trim());
      }

      const res = await fetchApi(`/content/heros/admin/list?${params}`);

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Failed to fetch slides data.");
      }

      setSlides(result.data || []);
      setMeta(result.meta);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      setError(msg);
      toast.error("Failed to load slides data");
      console.error("❌ Fetch Slides Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlides();
  }, [page, debouncedSearch, statusFilter, status, fetchApi]);

  // === DELETE HANDLER ===
  const handleDelete = async (id: string) => {
    if (!id || status !== "authenticated") return;

    if (!confirm("Are you sure you want to delete this slide?")) return;

    setDeletingId(id);
    try {
      const res = await fetchApi(`/content/heros/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to delete slide");
      }

      toast.success("Slide deleted successfully");
      fetchSlides();
    } catch (error: any) {
      console.error("❌ Delete Hero Error:", error);
      toast.error(error.message || "Failed to delete slide");
    } finally {
      setDeletingId(null);
    }
  };

  // === EXPORT HANDLER ===
  // (Optional: Jika endpoint export hero belum dibuat di backend, fitur ini bisa di-disable dulu)
  const handleExport = async () => {
    setExporting(true);
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      const exportFilters: HeroExportQuery = {
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
        `/content/heros/export/excel?${queryString}`,
        {
          method: "GET",
        },
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hero_slides_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success("Hero slides exported successfully!");
    } catch (error) {
      console.error("Export Error:", error);
      toast.error("Failed to export data (Endpoint might be missing).");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4 overflow-x-hidden w-full mx-auto">
      {/* === HEADER & SEARCH === */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 overflow-x-auto">
          <CardTitle className="text-xl font-semibold whitespace-nowrap">
            Hero Carousel Management 🖼️
          </CardTitle>

          <div className="flex flex-wrap md:flex-nowrap gap-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-1 md:w-64 min-w-50">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search title or CTA..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>

            {/* Filter Status (Tabel) */}
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val);
                setPage(1);
              }}>
              <SelectTrigger className="w-32 min-w-32">
                <SelectValue placeholder="Status" />
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

      {/* === ACTION BAR (ADD & EXPORT) === */}
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          <h3 className="w-full text-sm font-semibold text-muted-foreground">
            Filters & Actions:
          </h3>

          {/* Export Date Filters */}
          <div className="flex flex-col">
            <label className="text-xs font-medium text-muted-foreground mb-1">
              From
            </label>
            <Input
              type="date"
              value={exportStartDate}
              onChange={(e) => setExportStartDate(e.target.value)}
              className="w-36"
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
              className="w-36"
            />
          </div>

          {/* Add Button */}
          <Link href="/super-admin/content/hero/add" className="ml-auto">
            <Button size="sm" className="gap-2 cursor-pointer">
              <Plus className="h-4 w-4" /> Add Slide
            </Button>
          </Link>

          {/* Export Button */}
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
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20 text-center">Order</TableHead>
                  <TableHead className="w-30">Preview</TableHead>
                  <TableHead className="min-w-50">Title & CTA</TableHead>
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
                        <Skeleton className="h-16 w-24 rounded-md" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-48 mb-2" />
                        <Skeleton className="h-3 w-32" />
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
                      Error: {error}
                    </TableCell>
                  </TableRow>
                ) : slides.length > 0 ? (
                  slides.map((slide) => (
                    <TableRow key={slide.id}>
                      {/* Order */}
                      <TableCell className="text-center font-medium">
                        <Badge variant="outline" className="bg-slate-50">
                          {slide.displayOrder}
                        </Badge>
                      </TableCell>

                      {/* Image Preview */}
                      <TableCell>
                        <div className="relative w-24 h-14 bg-muted rounded-md overflow-hidden border">
                          <Image
                            src={slide.imageUrl}
                            alt={slide.altText || slide.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </TableCell>

                      {/* Title & CTA */}
                      <TableCell>
                        <div
                          className="font-semibold text-sm line-clamp-1"
                          title={slide.title}>
                          {slide.title}
                        </div>
                        {slide.ctaText && (
                          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100">
                              CTA: {slide.ctaText}
                            </span>
                          </div>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        {slide.isActive ? (
                          <Badge className="bg-green-500 hover:bg-green-600">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>

                      {/* Date */}
                      <TableCell className="text-sm whitespace-nowrap">
                        {formatDate(slide.createdAt)}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right space-x-2 whitespace-nowrap">
                        <Link
                          href={`/super-admin/content/heros/edit/${slide.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 cursor-pointer">
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-8 w-8 p-0 cursor-pointer"
                          onClick={() => handleDelete(slide.id)}
                          disabled={deletingId === slide.id}>
                          {deletingId === slide.id ? (
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
                        <p>No hero slides found.</p>
                      </div>
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
