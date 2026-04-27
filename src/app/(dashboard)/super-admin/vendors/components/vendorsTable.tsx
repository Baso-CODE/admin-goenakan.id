"use client";

import { ConfirmDeleteDialog } from "@/app/(dashboard)/components/confirmDeleteDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import * as LucideIcons from "lucide-react";
import { Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Vendor = {
  id: string;
  companyName: string;
  picName: string;
  country: string;
  isActive: boolean;
  createdAt: string;
  contacts?: {
    id: string;
    contactId: string;
    platform: {
      id: string;
      name: string;
      slug: string;
      icon: string;
    };
  }[];
};

type Meta = {
  hasNext: boolean;
  hasPrevious: boolean;
  page: number;
  perPage: number;
  total: number;
};

const VendorsTable = () => {
  const { fetchApi, status } = useApi();

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // export
  const [exporting, setExporting] = useState(false);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [exportIsActiveFilter, setExportIsActiveFilter] =
    useState<string>("ALL");

  // === FETCH VENDORS ===
  const fetchVendors = async () => {
    if (status !== "authenticated") return;

    setLoading(true);
    setError(null);
    try {
      // 1. Build Query Params
      const params = new URLSearchParams({
        page: page.toString(),
        take: "10",
        isActive: statusFilter,
      });

      if (debouncedSearch.trim()) {
        params.append("search", debouncedSearch.trim());
      }

      const res = await fetchApi(`/vendors?${params}`);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to fetch vendors");
      }

      const result = await res.json();
      setVendors(result.data || []);
      setMeta(result.meta);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      setError(msg);
      toast.error("Failed to load vendors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [page, debouncedSearch, statusFilter, status, fetchApi]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      // Kumpulkan Filter untuk Export
      const exportFilters: Record<string, string> = {};

      if (startDate) exportFilters.startDate = startDate;
      if (endDate) exportFilters.endDate = endDate;
      // Gunakan filter status aktif khusus untuk export
      if (exportIsActiveFilter !== "ALL")
        exportFilters.isActive = exportIsActiveFilter;
      const queryString = new URLSearchParams(exportFilters).toString();

      const response = await fetchApi(`/vendors/export/excel?${queryString}`, {
        method: "GET",
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(
          errData.message || "Export failed. Server responded with an error.",
        );
      }
      // Proses File Binary (Blob)
      const blob = await response.blob();
      const filename =
        response.headers
          .get("Content-Disposition")
          ?.match(/filename="(.+)"/)?.[1] || "vendor_master_export.xlsx";

      // Membuat URL objek untuk file yang akan diunduh
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Data Vendor berhasil di-export ke Excel!");
    } catch (error) {
      console.error("Export Error:", error);
      toast.error(
        "Gagal meng-export data. Pastikan filter sudah benar dan Anda memiliki akses.",
      );
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId || status !== "authenticated") return;

    setIsDeleting(true);
    try {
      const response = await fetchApi(`/vendors/${deleteId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Gagal menghapus vendor");
      }

      toast.success("Vendor berhasil dihapus");

      setPage(1);
      fetchVendors();
    } catch (error: any) {
      console.error("❌ Error delete vendor:", error);
      toast.error(error.message || "Terjadi kesalahan saat menghapus data");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };
  return (
    <div className="space-y-4 overflow-x-hidden w-full mx-auto">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <CardTitle className="text-xl font-semibold">
            Vendor Management
          </CardTitle>

          <div className="flex flex-wrap md:flex-nowrap gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64 min-w-50">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search vendor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(val) => setStatusFilter(val)}>
              <SelectTrigger className="w-37.5">
                <SelectValue placeholder="Filter status" />
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

      <hr />

      {/* === FILTER DAN EXPORT BARU === */}
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          <h3 className="w-full text-sm font-semibold text-muted-foreground">
            Export Filters:
          </h3>

          {/* Filter Status Aktif Export */}
          <Select
            value={exportIsActiveFilter}
            onValueChange={setExportIsActiveFilter}>
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
              <LucideIcons.Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LucideIcons.FileDown className="h-4 w-4" />
            )}
            {exporting ? "Exporting..." : "Export to Excel"}
          </Button>
        </div>
      </Card>
      {/* --- END: FILTER DAN EXPORT BARU --- */}
      <div className="p-1 flex justify-start">
        <Link href="/super-admin/vendors/add">
          <Button size="sm" className="gap-2">
            + Add Vendor
          </Button>
        </Link>
      </div>

      <Card className="w-full">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-50">Company Name</TableHead>
                  <TableHead>PIC Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-40 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-45" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-37.5" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-30" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-15" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-25" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-8 w-30" />
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
                ) : vendors.length > 0 ? (
                  vendors.map((vendor) => (
                    <TableRow key={vendor.id}>
                      <TableCell className="font-medium">
                        {vendor.companyName}
                      </TableCell>
                      <TableCell>{vendor.picName}</TableCell>
                      <TableCell>
                        <div className="flex gap-2 flex-wrap">
                          {vendor.contacts?.map((c) => {
                            const Icon =
                              (LucideIcons as any)[c.platform.icon] ||
                              LucideIcons.MessageCircle;
                            return (
                              <Link
                                key={c.id}
                                href={c.contactId}
                                target="_blank"
                                className="text-muted-foreground hover:text-primary transition flex items-center gap-1.5">
                                <Icon className="h-4 w-4" /> {c.platform.name}
                              </Link>
                            );
                          })}
                        </div>
                      </TableCell>
                      <TableCell>{vendor.country}</TableCell>
                      <TableCell>
                        {vendor.isActive ? (
                          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-red-500/10 text-red-600 border-red-500/20">
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {formatDate(vendor.createdAt, { style: "relative" })}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <LucideIcons.MoreHorizontal className="h-4 w-4" />{" "}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/super-admin/vendors/detail/${vendor.id}`}
                                className="cursor-pointer">
                                <LucideIcons.Eye className="mr-2 h-4 w-4" />{" "}
                                Detail
                              </Link>
                            </DropdownMenuItem>

                            <DropdownMenuItem asChild>
                              <Link
                                href={`/super-admin/vendors/edit/${vendor.id}`}
                                className="cursor-pointer">
                                <LucideIcons.Edit className="mr-2 h-4 w-4" />{" "}
                                Edit
                              </Link>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600 cursor-pointer"
                              onClick={() => setDeleteId(vendor.id)}>
                              <LucideIcons.Trash2 className="mr-2 h-4 w-4" />{" "}
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-6 text-muted-foreground">
                      No vendors found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {meta && (
        <div className="flex justify-between items-center p-4 border-t text-sm text-muted-foreground">
          <p>
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
        warningMessage="Vendor tidak dapat dihapus jika sudah digunakan dalam data lain. Pastikan tidak ada data yang terkait sebelum menghapus."
      />
    </div>
  );
};

export default VendorsTable;
