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
import {
  CalendarClock,
  Laptop,
  Loader2,
  Plus,
  Search,
  Smartphone,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// === Type Definitions ===
type PopupBanner = {
  id: string;
  title: string;
  desktopImageUrl: string;
  mobileImageUrl: string;
  altText?: string;
  linkUrl?: string;
  isActive: boolean;
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
};

type Meta = {
  hasNext: boolean;
  hasPrevious: boolean;
  page: number;
  perPage: number;
  total: number;
};

export default function PopupBannerTable() {
  const { fetchApi, status } = useApi();
  // === STATE DATA ===
  const [banners, setBanners] = useState<PopupBanner[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // === FILTER STATE ===
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 800);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);

  // === FETCH DATA ===
  const fetchBanners = async () => {
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

      const res = await fetchApi(`/content/popup-banners/admin/list?${params}`);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to fetch banners data.");
      }

      const result = await res.json();

      setBanners(result.data || []);
      setMeta(result.meta);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unknown error");
      toast.error("Failed to load banners data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, [page, debouncedSearch, statusFilter]);

  // === DELETE HANDLER ===
  const handleDelete = async (id: string) => {
    if (!id || status !== "authenticated") return;

    if (!confirm("Are you sure you want to delete this banner?")) return;

    setDeletingId(id);
    try {
      const res = await fetchApi(`/content/popup-banners/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to delete banner");
      }

      toast.success("Banner deleted successfully");
      fetchBanners(); // Refresh table data
    } catch (error: any) {
      console.error("❌ Error delete banner:", error);
      toast.error(error.message || "Failed to delete banner");
    } finally {
      setDeletingId(null);
    }
  };
  return (
    <div className="space-y-4 overflow-x-hidden w-full mx-auto">
      {/* === HEADER & SEARCH === */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 overflow-x-auto">
          <CardTitle className="text-xl font-semibold whitespace-nowrap">
            Popup Banner Management 📢
          </CardTitle>

          <div className="flex flex-wrap md:flex-nowrap gap-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-1 md:w-64 min-w-50">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>

            {/* Filter Status */}
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

      {/* === ACTION BAR === */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-sm font-semibold text-muted-foreground">
            Total Records: {meta?.total || 0}
          </h3>

          {/* Add Button */}
          <Link
            href="/super-admin/content/banner-popup/add"
            className="ml-auto">
            <Button size="sm" className="gap-2 cursor-pointer">
              <Plus className="h-4 w-4" /> Add Popup
            </Button>
          </Link>
        </div>
      </Card>

      {/* === TABLE === */}
      <Card className="w-full">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-45">Previews</TableHead>
                  <TableHead className="min-w-50">Title & Schedule</TableHead>
                  <TableHead>Link</TableHead>
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
                        <div className="flex gap-2">
                          <Skeleton className="h-10 w-16 rounded" />
                          <Skeleton className="h-10 w-8 rounded" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-3 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-16 ml-auto" />
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
                ) : banners.length > 0 ? (
                  banners.map((banner) => (
                    <TableRow key={banner.id}>
                      {/* Image Previews */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {/* Desktop Thumbnail */}
                          <div
                            className="relative w-16 h-10 bg-slate-100 rounded border overflow-hidden group"
                            title="Desktop View">
                            <Image
                              src={banner.desktopImageUrl}
                              alt="Desktop"
                              fill
                              className="object-cover"
                            />
                            <div className="absolute inset-0 bg-black/10 hidden group-hover:flex items-center justify-center">
                              <Laptop className="w-3 h-3 text-white" />
                            </div>
                          </div>

                          {/* Mobile Thumbnail */}
                          <div
                            className="relative w-8 h-10 bg-slate-100 rounded border overflow-hidden group"
                            title="Mobile View">
                            <Image
                              src={banner.mobileImageUrl}
                              alt="Mobile"
                              fill
                              className="object-cover"
                            />
                            <div className="absolute inset-0 bg-black/10 hidden group-hover:flex items-center justify-center">
                              <Smartphone className="w-3 h-3 text-white" />
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Title & Schedule */}
                      <TableCell>
                        <div className="font-semibold text-sm">
                          {banner.title}
                        </div>
                        {(banner.startDate || banner.endDate) && (
                          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <CalendarClock className="h-3 w-3" />
                            <span>
                              {banner.startDate
                                ? formatDate(banner.startDate)
                                : "Now"}
                              -
                              {banner.endDate
                                ? formatDate(banner.endDate)
                                : "Forever"}
                            </span>
                          </div>
                        )}
                      </TableCell>

                      {/* Link */}
                      <TableCell className="max-w-37.5">
                        {banner.linkUrl ? (
                          <a
                            href={banner.linkUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-blue-600 hover:underline truncate block">
                            {banner.linkUrl}
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            -
                          </span>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        {banner.isActive ? (
                          <Badge className="bg-green-500 hover:bg-green-600">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>

                      {/* Date */}
                      <TableCell className="text-sm whitespace-nowrap">
                        {formatDate(banner.createdAt)}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right space-x-2 whitespace-nowrap">
                        <Link
                          href={`/super-admin/content/banner-popup/edit/${banner.id}`}>
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
                          onClick={() => handleDelete(banner.id)}
                          disabled={deletingId === banner.id}>
                          {deletingId === banner.id ? (
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
                        <p>No popup banners found.</p>
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
