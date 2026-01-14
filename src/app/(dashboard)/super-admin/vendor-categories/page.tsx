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
import { FileDown, Loader2, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type VendorCategory = {
  id: string;
  name: string;
  description: string;
  type: string;
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

const VendorCategories = () => {
  const [categories, setCategories] = useState<VendorCategory[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  const [page, setPage] = useState(1);

  // State Filter Export (Baru)
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [isActiveFilter, setIsActiveFilter] = useState<string>("ALL");

  // === FETCH DATA DARI BACKEND ===
  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();
      const params = new URLSearchParams({
        page: page.toString(),
        take: "10",
        type: typeFilter,
      });
      if (debouncedSearch.trim()) {
        params.append("search", debouncedSearch.trim());
      }
      const res = await fetch(
        `http://localhost:8000/vendor-categories?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await res.json();
      setCategories(result.data || []);
      setMeta(result.meta);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unknown error");
      toast.error("Failed to load vendor categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [page, debouncedSearch, typeFilter]);

  const handleExport = async () => {
    setExporting(true);
    try {
      // 1. Ambil Token Autentikasi
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      // 2. Kumpulkan Filter
      const exportFilters: Record<string, string> = {};

      if (startDate) exportFilters.startDate = startDate;
      if (endDate) exportFilters.endDate = endDate;
      // Gunakan typeFilter yang sudah ada untuk filter TYPE
      if (typeFilter && typeFilter !== "ALL") exportFilters.type = typeFilter;

      // Filter isActive
      if (isActiveFilter !== "ALL") exportFilters.isActive = isActiveFilter;

      const queryString = new URLSearchParams(exportFilters).toString();

      const exportUrl = `http://localhost:8000/vendor-categories/export/excel?${queryString}`;

      const response = await fetch(exportUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Export failed. Server responded with an error.");
      }

      // 4. Proses File Binary (Blob)
      const blob = await response.blob();
      const filename =
        response.headers
          .get("Content-Disposition")
          ?.match(/filename="(.+)"/)?.[1] || "vendor_categories_export.xlsx";

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
        "Gagal meng-export data. Pastikan filter sudah benar dan Anda memiliki akses."
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4 w-full  mx-auto">
      {/* === HEADER === */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <CardTitle className="text-xl font-semibold">
            Vendor Categories Management
          </CardTitle>

          <div className="flex gap-3 w-full md:w-auto">
            {/* SEARCH */}
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>

            {/* FILTER TYPE */}
            <Select
              value={typeFilter}
              onValueChange={(val) => setTypeFilter(val)}>
              <SelectTrigger className="w-37.5">
                <SelectValue placeholder="Filter type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="SERVICE">Service</SelectItem>
                <SelectItem value="PRODUCT">Product</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* === FILTER DAN EXPORT BARU === */}
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          <h3 className="w-full text-sm font-semibold text-muted-foreground">
            Export Filters:
          </h3>

          {/* Filter Status Aktif */}
          <Select value={isActiveFilter} onValueChange={setIsActiveFilter}>
            <SelectTrigger className="w-[120px]">
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
              Start Date
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
              End Date
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
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            {exporting ? "Exporting..." : "Export to Excel"}
          </Button>
        </div>
      </Card>
      {/* --- END: FILTER DAN EXPORT BARU --- */}
      {/* === ADD BUTTON === */}
      <div className="p-1 flex justify-start">
        <Link href="/super-admin/vendor-categories/add">
          <Button size="sm" className="gap-2 cursor-pointer">
            + Add Category
          </Button>
        </Link>
      </div>

      <Card className="w-full">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Category Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                /* Penanganan Loading menggunakan Skeleton */
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    {/* Kolom 1: Category Name (w-[250px]) */}
                    <TableCell className="h-12 w-[250px]">
                      <Skeleton className="h-4 w-50" />
                    </TableCell>
                    {/* Kolom 2: Description */}
                    <TableCell className="h-12">
                      <Skeleton className="h-4 w-[250px]" />
                    </TableCell>
                    {/* Kolom 3: Type */}
                    <TableCell className="h-12">
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    {/* Kolom 4: Status */}
                    <TableCell className="h-12">
                      <Skeleton className="h-4 w-[60px]" />
                    </TableCell>
                    {/* Kolom 5: Created */}
                    <TableCell className="h-12">
                      <Skeleton className="h-4 w-25" />
                    </TableCell>
                    {/* Kolom 6: Actions (text-right) */}
                    <TableCell className="h-12 text-right">
                      <div className="flex justify-end space-x-2">
                        <Skeleton className="h-8 w-[50px]" />
                        {/* Edit Button */}
                        <Skeleton className="h-8 w-[60px]" />
                        {/* Delete Button */}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : error ? ( // Asumsi ada state/prop 'error'
                /* Penanganan Error */
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-red-500 py-6">
                    Error: {error || "Failed to load categories."}
                  </TableCell>
                </TableRow>
              ) : categories.length > 0 ? (
                /* Menampilkan Data Category */
                categories.map((data) => (
                  <TableRow key={data.id}>
                    <TableCell className="font-medium">{data.name}</TableCell>
                    <TableCell>{data.description}</TableCell>
                    <TableCell>{data.type}</TableCell>
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
                    <TableCell className="text-right space-x-2">
                      <Link
                        href={`/super-admin/vendor-categories/edit/${data.id}`}>
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
                ))
              ) : (
                /* Data Kosong */
                <TableRow>
                  <TableCell
                    colSpan={6} // Jumlah kolom di TableHead
                    className="text-center py-6 text-muted-foreground">
                    No categories found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {/* === PAGINATION === */}
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
};

export default VendorCategories;
