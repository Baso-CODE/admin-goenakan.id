"use client";

import { ConfirmDeleteDialog } from "@/app/(dashboard)/components/confirmDeleteDialog";
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
import * as LucideIcons from "lucide-react";
import { Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// --- TYPE DEFINITIONS (Sudah Benar) ---
type ContactPlatform = {
  id: string;
  name: string;
  slug: string;
  icon: string;
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
// ----------------------------------------

export default function ContactPlatformsManagement() {
  const { fetchApi, status } = useApi();
  const [platforms, setPlatforms] = useState<ContactPlatform[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [page, setPage] = useState(1);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  const [isActiveFilter, setIsActiveFilter] = useState<string>("ALL");

  // === FETCH DATA ===
  const fetchContactPlatforms = async () => {
    setLoading(true);
    setError(null);
    try {
      if (status === "loading") return;

      const params = new URLSearchParams({
        page: page.toString(),
        take: "10",
        isActive: isActiveFilter,
      });

      if (debouncedSearch.trim())
        params.append("search", debouncedSearch.trim());

      // Tambahkan filter tanggal ke kueri tabel
      if (startDate)
        params.append("startDate", format(startDate, "yyyy-MM-dd"));
      if (endDate) params.append("endDate", format(endDate, "yyyy-MM-dd"));

      const res = await fetchApi(`/contact-platforms?${params}`);
      const result = await res.json();

      if (!res.ok) throw new Error(result.message || "Failed to fetch data");

      setPlatforms(result.data || []);
      setMeta(result.meta);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unknown error");
      toast.error("Failed to load contact platforms");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContactPlatforms();
  }, [page, debouncedSearch, isActiveFilter, startDate, endDate, status]);

  // === HANDLE EXPORT ===
  const handleExport = async () => {
    setExporting(true);
    try {
      const exportFilters: Record<string, string> = {};

      if (startDate) exportFilters.startDate = format(startDate, "yyyy-MM-dd");
      if (endDate) exportFilters.endDate = format(endDate, "yyyy-MM-dd");
      if (isActiveFilter !== "ALL") exportFilters.isActive = isActiveFilter;
      if (debouncedSearch.trim()) exportFilters.search = debouncedSearch.trim();

      const queryString = new URLSearchParams(exportFilters).toString();

      // Pastikan endpoint backend untuk export sudah benar
      const response = await fetchApi(
        `/contact-platforms/export/excel?${queryString}`,
      );

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `contact_platforms_${format(new Date(), "yyyyMMdd")}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Data berhasil di-export!");
    } catch (error) {
      toast.error("Gagal meng-export data.");
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const response = await fetchApi(`/vendor-items/${deleteId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Gagal menghapus kategori");
      }

      toast.success("Item berhasil dihapus");
      setPage(1);
      fetchContactPlatforms();
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan saat menghapus data");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-4 w-full  mx-auto">
      {/* === HEADER & FILTER TERPADU === */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <CardTitle className="text-2xl font-bold whitespace-nowrap flex items-center gap-2">
            <LucideIcons.Package className="h-7 w-7" />
            Contact Platforms
          </CardTitle>

          <div className="flex gap-2 ml-auto">
            <Link href="/super-admin/contact-platforms/add">
              <Button size="sm" className="gap-2 cursor-pointer">
                + Add Platform
              </Button>
            </Link>
            <Button
              size="sm"
              className="gap-2 bg-green-600 hover:bg-green-700"
              onClick={handleExport}
              disabled={exporting}>
              {exporting ? (
                <LucideIcons.Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LucideIcons.FileDown className="h-4 w-4" />
              )}
              {exporting ? "Exporting..." : "Export Excel"}
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Baris Filter - Simetris Rata Bawah */}
          <div className="flex flex-wrap items-end gap-3">
            {/* Search */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-muted-foreground font-semibold uppercase px-1">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Platform name..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-8 w-60 h-10"
                />
              </div>
            </div>

            {/* Status */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-muted-foreground font-semibold uppercase px-1">
                Status
              </label>
              <Select
                value={isActiveFilter}
                onValueChange={(val) => {
                  setIsActiveFilter(val);
                  setPage(1);
                }}>
                <SelectTrigger className="w-32 h-10">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range Creation */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-muted-foreground font-semibold uppercase px-1">
                Date Created
              </label>
              <div className="flex items-center gap-2">
                <DatePickerHelper
                  date={startDate}
                  setDate={(date) => {
                    setStartDate(date);
                    setPage(1);
                  }}
                  placeholder="Start Date"
                />
                <span className="text-muted-foreground">-</span>
                <DatePickerHelper
                  date={endDate}
                  setDate={(date) => {
                    setEndDate(date);
                    setPage(1);
                  }}
                  placeholder="End Date"
                />
              </div>
            </div>

            {/* Clear Filter */}
            {(startDate || endDate || isActiveFilter !== "ALL" || search) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStartDate(undefined);
                  setEndDate(undefined);
                  setIsActiveFilter("ALL");
                  setSearch("");
                  setPage(1);
                }}
                className="h-10 text-muted-foreground hover:text-red-600">
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* === TABLE (Konten Lain Sudah Benar) === */}
      <Card className="w-full">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-50">Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Icon</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* ... (Render data dan skeleton sudah benar) ... */}
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell className="h-12 w-50">
                      <Skeleton className="h-4 w-37.5" />
                    </TableCell>
                    <TableCell className="h-12">
                      <Skeleton className="h-4 w-45" />
                    </TableCell>
                    <TableCell className="h-12">
                      <Skeleton className="h-6 w-6 rounded-md" />
                    </TableCell>
                    <TableCell className="h-12">
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell className="h-12">
                      <Skeleton className="h-4 w-25" />
                    </TableCell>
                    <TableCell className="h-12 text-right">
                      <Skeleton className="h-8 w-25" />
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
              ) : platforms.length > 0 ? (
                platforms.map((data) => {
                  const Icon =
                    (LucideIcons as any)[data.icon] || LucideIcons.HelpCircle;
                  return (
                    <TableRow key={data.id}>
                      <TableCell className="font-medium">{data.name}</TableCell>
                      <TableCell>{data.slug}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon className="h-5 w-5 text-primary" />
                          <span className="text-sm text-muted-foreground">
                            {data.icon}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {data.isActive ? (
                          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                            Active
                          </Badge>
                        ) : (
                          <Badge
                            variant="destructive"
                            className="bg-red-500/10 text-red-600 border-red-500/20">
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {formatDate(data.createdAt, { style: "relative" })}
                      </TableCell>
                      <TableCell className=" space-x-2">
                        <Link
                          href={`/super-admin/contact-platforms/edit/${data.id}`}>
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleteId(data.id)}
                          className="text-xs">
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-6 text-muted-foreground">
                    No contact platforms found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {/* === PAGINATION (Sudah Benar) === */}
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
        warningMessage="Contact Platform tidak dapat dihapus jika sudah digunakan dalam data lain. Pastikan tidak ada data yang terkait sebelum menghapus."
      />
    </div>
  );
}
