"use client";

import { format } from "date-fns";
import * as LucideIcons from "lucide-react";
import { Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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

import { ConfirmDeleteDialog } from "@/app/(dashboard)/components/confirmDeleteDialog";
import { DatePickerHelper } from "@/helper/datePickerHelper";
import { useDebounce } from "@/helper/debounce";
import { useApi } from "@/hooks/useApi";
import { countries } from "@/lib/countries";
import { formatDate } from "@/utils/formatDate";

type Vendor = {
  id: string;
  companyName: string;
  picName: string;
  country: string;
  city?: string;
  type?: string;
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
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // export
  const [exporting, setExporting] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  // === FETCH VENDORS ===
  const fetchVendors = async () => {
    if (status !== "authenticated") return;

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        take: "10",
        isActive: statusFilter,
      });

      if (debouncedSearch.trim())
        params.append("search", debouncedSearch.trim());
      if (typeFilter !== "ALL") params.append("type", typeFilter); // Menyelipkan parameter type
      if (startDate)
        params.append("startDate", format(startDate, "yyyy-MM-dd"));
      if (endDate) params.append("endDate", format(endDate, "yyyy-MM-dd"));

      const res = await fetchApi(`/vendors?${params}`);
      if (!res.ok) throw new Error("Failed to fetch vendors");

      const result = await res.json();
      setVendors(result.data || []);
      setMeta(result.meta);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unknown error");
      toast.error("Failed to load vendors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [
    page,
    debouncedSearch,
    statusFilter,
    typeFilter, // Trigger fetch ulang saat tipe diubah
    startDate,
    endDate,
    status,
    fetchApi,
  ]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const exportFilters: Record<string, string> = {};

      if (startDate) exportFilters.startDate = format(startDate, "yyyy-MM-dd");
      if (endDate) exportFilters.endDate = format(endDate, "yyyy-MM-dd");
      if (statusFilter !== "ALL") exportFilters.isActive = statusFilter;
      if (typeFilter !== "ALL") exportFilters.type = typeFilter;
      if (debouncedSearch.trim()) exportFilters.search = debouncedSearch.trim();

      const queryString = new URLSearchParams(exportFilters).toString();
      const response = await fetchApi(`/vendors/export/excel?${queryString}`, {
        method: "GET",
      });

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vendor_export_${format(new Date(), "yyyyMMdd")}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Data Vendor berhasil di-export!");
    } catch (error) {
      toast.error("Gagal meng-export data.");
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
        <CardHeader className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <CardTitle className="text-2xl font-bold whitespace-nowrap flex items-center gap-2">
            <LucideIcons.Package className="h-7 w-7" />
            Vendor Management
          </CardTitle>

          <div className="flex gap-2 ml-auto">
            <Link href="/super-admin/vendors/add">
              <Button size="sm" className="gap-2">
                + Add Vendor
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
                  placeholder="Search vendor atau kota..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-8 w-60 h-10"
                />
              </div>
            </div>

            {/* TAMBAHAN: Type Filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-muted-foreground font-semibold uppercase px-1">
                Type
              </label>
              <Select
                value={typeFilter}
                onValueChange={(val) => {
                  setTypeFilter(val);
                  setPage(1);
                }}>
                <SelectTrigger className="w-32 h-10">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="PRODUCT">Product</SelectItem>
                  <SelectItem value="SERVICE">Service</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-muted-foreground font-semibold uppercase px-1">
                Status
              </label>
              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val);
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

            {/* Date Range Picker */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-muted-foreground font-semibold uppercase px-1">
                Start Date
              </label>
              <DatePickerHelper
                date={startDate}
                setDate={(date) => {
                  setStartDate(date);
                  setPage(1);
                }}
                placeholder="Start Date"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-muted-foreground font-semibold uppercase px-1">
                End Date
              </label>
              <DatePickerHelper
                date={endDate}
                setDate={(date) => {
                  setEndDate(date);
                  setPage(1);
                }}
                placeholder="End Date"
              />
            </div>

            {/* Clear Filter Button */}
            {(startDate ||
              endDate ||
              statusFilter !== "ALL" ||
              typeFilter !== "ALL" ||
              search) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStartDate(undefined);
                  setEndDate(undefined);
                  setStatusFilter("ALL");
                  setTypeFilter("ALL");
                  setSearch("");
                  setPage(1);
                }}
                className="h-10 text-muted-foreground hover:text-red-600 transition-colors">
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-48">Company Name</TableHead>
                  <TableHead>Type</TableHead> {/* Kolom Type */}
                  <TableHead>PIC Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>City</TableHead> {/* Kolom City */}
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-32 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {/* Karena sekarang ada 9 kolom, kita buat 9 skeleton */}
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-28" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
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
                      <TableCell className="text-right">
                        <Skeleton className="h-8 w-8 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : error ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
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

                      {/* Tipe Vendor */}
                      <TableCell>
                        {vendor.type ? (
                          <Badge variant="outline" className="capitalize">
                            {vendor.type.toLowerCase()}
                          </Badge>
                        ) : (
                          "-"
                        )}
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

                      {/* Negara & Emoji Bendera */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className="text-lg leading-none"
                            title={vendor.country}>
                            {countries.find((c) => c.name === vendor.country)
                              ?.flag || "🌍"}
                          </span>
                          <span className="truncate max-w-25">
                            {vendor.country || "-"}
                          </span>
                        </div>
                      </TableCell>

                      {/* Kota */}
                      <TableCell>
                        <span className="truncate max-w-30 inline-block">
                          {vendor.city || "-"}
                        </span>
                      </TableCell>

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
                              <LucideIcons.MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/super-admin/vendors/detail/${vendor.id}`}
                                className="cursor-pointer">
                                <LucideIcons.Eye className="mr-2 h-4 w-4" />
                                Detail
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/super-admin/vendors/edit/${vendor.id}`}
                                className="cursor-pointer">
                                <LucideIcons.Edit className="mr-2 h-4 w-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600 cursor-pointer"
                              onClick={() => setDeleteId(vendor.id)}>
                              <LucideIcons.Trash2 className="mr-2 h-4 w-4" />
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
                      colSpan={9} // Disesuaikan menjadi 9 kolom
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
