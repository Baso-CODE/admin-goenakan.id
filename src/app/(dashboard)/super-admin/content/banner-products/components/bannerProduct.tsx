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
import { useDebounce } from "@/helper/debounce";
import { useApi } from "@/hooks/useApi";
import { formatDate } from "@/utils/formatDate";
import { format } from "date-fns";
import {
  ImageIcon,
  Link as LinkIcon,
  ListOrdered,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function BannerProductTable() {
  const { fetchApi, status } = useApi();

  // === STATE DATA ===
  const [banners, setBanners] = useState<any[]>([]);
  const [meta, setMeta] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State untuk Delete
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // === State Filter Gabungan ===
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  const debouncedSearch = useDebounce(search, 500);

  // === FETCH DATA ===
  const fetchBanners = async () => {
    if (status === "loading") return;

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        take: "10",
      });

      // Filter Status Aktif
      if (statusFilter !== "ALL") {
        params.append("isActive", statusFilter);
      }

      // Filter Pencarian
      if (debouncedSearch.trim()) {
        params.append("search", debouncedSearch.trim());
      }

      // Filter Rentang Tanggal (Gunakan format yyyy-MM-dd)
      if (startDate) {
        params.append("startDate", format(startDate, "yyyy-MM-dd"));
      }
      if (endDate) {
        params.append("endDate", format(endDate, "yyyy-MM-dd"));
      }

      const res = await fetchApi(`/banner-products?${params}`);
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Failed to fetch banners data.");
      }

      setBanners(result.data || []);
      setMeta(result.meta);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unknown error");
      toast.error("Failed to load banners data");
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch data saat filter atau status berubah
  useEffect(() => {
    fetchBanners();
  }, [
    page,
    debouncedSearch,
    statusFilter,
    startDate,
    endDate,
    status, // Menambahkan status agar fetch ulang saat login selesai
    fetchApi,
  ]);

  // === DELETE HANDLER ===
  const handleDelete = async () => {
    if (!deletingId) return;

    setIsDeleting(true);
    try {
      const res = await fetchApi(`/banner-products/${deletingId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Gagal menghapus banner");
      }

      toast.success("Banner berhasil dihapus");
      fetchBanners(); // Refresh data tabel
    } catch (error: any) {
      console.error("❌ Error delete banner:", error);
      toast.error(error.message || "Terjadi kesalahan saat menghapus data");
    } finally {
      setIsDeleting(false);
      setDeletingId(null); // Tutup dialog
    }
  };

  return (
    <div className="space-y-4 overflow-x-hidden w-full mx-auto">
      {/* === HEADER & SEARCH === */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 overflow-x-auto">
          <CardTitle className="text-xl font-semibold whitespace-nowrap text-stone-800">
            Banner Product Management 🖼️
          </CardTitle>

          <div className="flex flex-wrap md:flex-nowrap gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64 min-w-50">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-stone-400" />
              <Input
                type="text"
                placeholder="Search title or subtitle..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 border-stone-200"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val);
                setPage(1);
              }}>
              <SelectTrigger className="w-32 min-w-32 border-stone-200">
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
      <Card className="p-4 border-stone-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-sm font-semibold text-stone-500">
            Total Records: {meta?.total || 0}
          </h3>

          <Link
            href="/super-admin/content/banner-products/add"
            className="ml-auto">
            <Button
              size="sm"
              className="gap-2 cursor-pointer bg-stone-800 hover:bg-stone-900">
              <Plus className="h-4 w-4" /> Add Banner
            </Button>
          </Link>
        </div>
      </Card>

      {/* === TABLE === */}
      <Card className="w-full border-stone-200">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader className="bg-stone-50">
                <TableRow>
                  <TableHead className="w-40">Preview</TableHead>
                  <TableHead className="min-w-50">Content Info</TableHead>
                  <TableHead>Target Link</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Skeleton className="h-12 w-28 rounded-md" />
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
                      <TableCell>
                        <div className="relative w-28 h-12 bg-stone-100 rounded-md border border-stone-200 overflow-hidden group">
                          <Image
                            src={banner.imageUrl}
                            alt={banner.title || "Banner"}
                            fill
                            className="object-cover transition-transform group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-black/10 hidden group-hover:flex items-center justify-center">
                            <ImageIcon className="w-4 h-4 text-white drop-shadow-md" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-sm text-stone-800">
                          {banner.title || (
                            <span className="italic text-stone-400">
                              No Title
                            </span>
                          )}
                        </div>
                        {banner.subtitle && (
                          <div className="text-xs text-stone-500 mt-0.5 line-clamp-1">
                            {banner.subtitle}
                          </div>
                        )}
                        <div className="text-[10px] font-medium text-stone-400 mt-1.5 flex items-center gap-1 uppercase tracking-wider">
                          <ListOrdered className="h-3 w-3" /> Order:{" "}
                          {banner.sortOrder}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-40">
                        {banner.linkUrl ? (
                          <a
                            href={banner.linkUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800 hover:underline truncate flex items-center gap-1">
                            <LinkIcon className="h-3 w-3 shrink-0" />
                            <span className="truncate">{banner.linkUrl}</span>
                          </a>
                        ) : (
                          <span className="text-xs text-stone-400 italic">
                            No link
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {banner.isActive ? (
                          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none shadow-none">
                            Active
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-stone-100 text-stone-600">
                            Draft
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-stone-600 whitespace-nowrap">
                        {formatDate(banner.createdAt)}
                      </TableCell>
                      <TableCell className="text-right space-x-2 whitespace-nowrap">
                        <Link
                          href={`/super-admin/content/banner-products/edit/${banner.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 border-stone-200 text-stone-700 cursor-pointer">
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-8 w-8 p-0 cursor-pointer"
                          onClick={() => setDeletingId(banner.id)} // 1. Set ID untuk buka dialog
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-12 text-stone-400">
                      <div className="flex flex-col items-center gap-3">
                        <ImageIcon className="h-10 w-10 opacity-20" />
                        <p>Belum ada banner product yang dibuat.</p>
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
        <div className="flex justify-between items-center p-4 border-t text-sm text-stone-500 bg-white rounded-md border border-stone-200 shadow-sm">
          <p>
            Page {meta.page} of {Math.ceil(meta.total / meta.perPage) || 1} (
            {meta.total} items)
          </p>
          <div className="space-x-2">
            <Button
              size="sm"
              variant="outline"
              disabled={!meta.hasPrevious}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="border-stone-200">
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={!meta.hasNext}
              onClick={() => setPage((p) => p + 1)}
              className="border-stone-200">
              Next
            </Button>
          </div>
        </div>
      )}

      {/* === DIALOG KONFIRMASI DELETE === */}
      <ConfirmDeleteDialog
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete} // 2. Jalankan fungsi hapus yang sesungguhnya
        isLoading={isDeleting}
        warningMessage="Banner yang dihapus tidak dapat dipulihkan. Pastikan Anda ingin menghapus banner ini."
      />
    </div>
  );
}
