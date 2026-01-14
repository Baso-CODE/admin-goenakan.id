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
import { formatDate } from "@/utils/formatDate";
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
  const [platforms, setPlatforms] = useState<ContactPlatform[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [page, setPage] = useState(1);

  // NOTE: Menghapus state 'typeFilter' karena tidak ada di skema Prisma Anda.
  // const [typeFilter, setTypeFilter] = useState<string>("ALL");

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  // 'ALL' | 'true' | 'false'
  const [isActiveFilter, setIsActiveFilter] = useState<string>("ALL");

  // === FETCH DATA DARI BACKEND (UNTUK TABEL) ===
  // Note: Filter tanggal dan isActive tidak disertakan di sini,
  // hanya search dan pagination, yang sudah benar untuk tampilan tabel.
  const fetchContactPlatforms = async () => {
    setLoading(true);
    setError(null);
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();
      const params = new URLSearchParams({
        page: page.toString(),
        take: "10",
      });
      if (debouncedSearch.trim()) {
        params.append("search", debouncedSearch.trim());
      }
      // PENTING: Tambahkan filter Status Aktif untuk tampilan tabel
      if (isActiveFilter !== "ALL") {
        params.append("isActive", isActiveFilter);
      }

      // Anda juga bisa menambahkan filter tanggal di sini jika mau
      // if (startDate) params.append("startDate", startDate);
      // if (endDate) params.append("endDate", endDate);

      const res = await fetch(
        `http://localhost:8000/contact-platforms?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Failed to fetch data");
      }
      setPlatforms(result.data || []);
      setMeta(result.meta);
    } catch (error) {
      console.error(error);
      setError(error instanceof Error ? error.message : "Unknown error");
      toast.error("Failed to load contact platforms");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Jalankan ulang fetch saat page, search, atau isActiveFilter berubah
    fetchContactPlatforms();
  }, [page, debouncedSearch, isActiveFilter]);

  // === HANDLE EXPORT DATA EXCEL (PERBAIKAN FOKUS DI SINI) ===
  const handleExport = async () => {
    setExporting(true);
    try {
      // 1. Ambil Token Autentikasi
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      // 2. Kumpulkan Filter untuk Export
      const exportFilters: Record<string, string> = {};

      if (startDate) exportFilters.startDate = startDate;
      if (endDate) exportFilters.endDate = endDate;

      // Logika isActiveFilter: Hanya tambahkan jika BUKAN 'ALL'
      if (isActiveFilter !== "ALL") {
        // Backend mengharapkan 'true' atau 'false'
        exportFilters.isActive = isActiveFilter;
      }

      // NOTE: Filter search (debouncedSearch) tidak disertakan di sini.
      // Jika Anda ingin search juga di-export, uncomment baris ini:
      // if (debouncedSearch.trim()) exportFilters.search = debouncedSearch.trim();

      const queryString = new URLSearchParams(exportFilters).toString();

      const exportUrl = `http://localhost:8000/contact-platforms/export/excel?${queryString}`;

      const response = await fetch(exportUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorBody = await response
          .json()
          .catch(() => ({ message: "Unknown error" }));
        throw new Error(
          errorBody.message || "Export failed. Server responded with an error."
        );
      }

      // 4. Proses File Binary (Blob)
      const blob = await response.blob();
      const filename =
        response.headers
          .get("Content-Disposition")
          ?.match(/filename="(.+)"/)?.[1] || "contact_platforms.xlsx";

      // Membuat URL objek untuk file yang akan diunduh
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename; // Nama file download
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url); // Bersihkan URL

      toast.success("Data berhasil di-export ke Excel!");
    } catch (error) {
      console.error("Export Error:", error);
      toast.error(
        `Gagal meng-export data: ${
          error instanceof Error ? error.message : "Error tidak diketahui"
        }`
      );
    } finally {
      setExporting(false);
    }
  };
  // -------------------------------------------------------------

  return (
    <div className="space-y-4 w-full  mx-auto">
      {/* === HEADER === */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <CardTitle className="text-xl font-semibold">
            Contact Platforms Management
          </CardTitle>

          {/* SEARCH */}
          <div className="relative flex-1 md:w-32">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search platform..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardHeader>
      </Card>

      {/* === FILTER DAN EXPORT BARU === */}
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          <h3 className="w-full text-sm font-semibold text-muted-foreground">
            Export Filters:
          </h3>

          <Select value={isActiveFilter} onValueChange={setIsActiveFilter}>
            <SelectTrigger className="w-30">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>

          {/* Filter Tanggal Mulai */}
          <div className="flex flex-col">
            <label className="text-xs font-medium text-muted-foreground mb-1">
              Start Date (Creation)
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-37.5"
            />
          </div>

          {/* Filter Tanggal Akhir */}
          <div className="flex flex-col">
            <label className="text-xs font-medium text-muted-foreground mb-1">
              End Date (Creation)
            </label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-37.5"
            />
          </div>

          {/* Tombol Export */}
          <Button
            size="sm"
            className="gap-2 bg-green-600 hover:bg-green-700 ml-auto"
            onClick={handleExport}
            disabled={exporting}>
            {exporting ? (
              <LucideIcons.Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LucideIcons.FileDown className="h-4 w-4" />
            )}
            {exporting ? "Exporting..." : "Export to Excel"}
          </Button>
        </div>
      </Card>
      {/* --- END: FILTER DAN EXPORT BARU --- */}

      {/* === ADD BUTTON === */}
      <div className="p-1 flex justify-start">
        <Link href="/super-admin/contact-platforms/add">
          <Button size="sm" className="gap-2 cursor-pointer">
            + Add Platform
          </Button>
        </Link>
      </div>

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
    </div>
  );
}
