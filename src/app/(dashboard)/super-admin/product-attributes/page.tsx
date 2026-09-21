"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { format } from "date-fns"; // ✨ TAMBAHAN: Untuk mengubah format Date ke string
import { FileDown, Loader2, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ConfirmDeleteDialog } from "../../components/confirmDeleteDialog";

// === Type definitions ===
type AttributeValue = {
  id: string;
  value: string;
};

type Attribute = {
  id: string;
  name: string;
  createdAt: string;
  values: AttributeValue[];
  productId?: string | null;
  product?: { name: string } | null;
  parentValueId?: string | null;
  parentValue?: {
    id: string;
    value: string;
    attribute: {
      id: string;
      name: string;
    };
  } | null;
  type: string;
};

type Meta = {
  hasNext: boolean;
  hasPrevious: boolean;
  page: number;
  perPage: number;
  total: number;
};

// Interface untuk Query Export
interface AttributeExportQuery {
  startDate?: string;
  endDate?: string;
  search?: string;
}

export default function ProductAttributesPage() {
  const { fetchApi, status } = useApi();

  // --- STATE UNTUK TABLE & SEARCH UTAMA ---
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 800);
  const [page, setPage] = useState(1);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- STATE UNTUK EXPORT FILTER ---
  // ✨ UBAH: Tipe state diubah menjadi Date | undefined agar cocok dengan DatePickerHelper
  const [exportStartDate, setExportStartDate] = useState<Date | undefined>(
    undefined,
  );
  const [exportEndDate, setExportEndDate] = useState<Date | undefined>(
    undefined,
  );
  const [exporting, setExporting] = useState<boolean>(false);

  // --- FUNGSI FETCH DATA (Untuk Tabel) ---
  const fetchAttributes = async () => {
    if (status !== "authenticated") return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        take: "10",
      });

      if (debouncedSearch.trim()) {
        params.append("search", debouncedSearch.trim());
      }

      const res = await fetchApi(`/product-attributes?${params}`);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `HTTP Error ${res.status}`);
      }

      const result = await res.json();
      setAttributes(result.data || []);
      setMeta(result.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      toast.error("Failed to load product attributes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttributes();
  }, [page, debouncedSearch, status, fetchApi]);

  const handleDelete = async () => {
    if (!deleteId || status !== "authenticated") return;

    setIsDeleting(true);
    try {
      const res = await fetchApi(`/product-attributes/${deleteId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to delete attribute");
      }

      toast.success("Product Attribute berhasil dihapus!");
      setDeleteId(null);
      fetchAttributes();
    } catch (error: any) {
      console.error("❌ Delete Error:", error);
      toast.error(
        error.message ||
          "Gagal menghapus attribute. Pastikan data tidak sedang digunakan.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // --- FUNGSI HANDLE EXPORT ---
  const handleExportAttributes = async () => {
    setExporting(true);
    try {
      // ✨ UBAH: Memformat objek Date kembali menjadi string (YYYY-MM-DD) agar bisa dibaca backend
      const exportFilters: AttributeExportQuery = {
        ...(exportStartDate && {
          startDate: format(exportStartDate, "yyyy-MM-dd"),
        }),
        ...(exportEndDate && { endDate: format(exportEndDate, "yyyy-MM-dd") }),
        ...(search.trim() && { search: search.trim() }),
      };

      const queryString = new URLSearchParams(
        exportFilters as Record<string, string>,
      ).toString();

      const response = await fetchApi(
        `/product-attributes/export/excel?${queryString}`,
        {
          method: "GET",
        },
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.error("❌ Server Error:", errData);
        throw new Error(
          errData.message || "Export failed. Server responded with an error.",
        );
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("Content-Disposition");

      const filenameMatch = contentDisposition?.match(/filename="(.+?)"/i);
      const filename = filenameMatch
        ? filenameMatch[1]
        : `product_attributes_export_${new Date()
            .toISOString()
            .slice(0, 10)}.xlsx`;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Data Product Attributes berhasil di-export ke Excel!");
    } catch (error) {
      console.error("Export Error:", error);
      toast.error(
        "Gagal meng-export data. Pastikan endpoint backend sudah siap.",
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4 w-auto mx-auto ">
      {/* ================= HEADER & SEARCH UTAMA ================= */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <CardTitle className="text-xl font-semibold">
            Product Attributes Management
          </CardTitle>

          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search attribute..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* ================= FILTER TANGGAL EXPORT ================= */}
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          <h3 className="w-full text-sm font-semibold text-muted-foreground">
            Export Filter (opsional, berdasarkan Created Date):
          </h3>

          {/* Filter Tanggal Mulai Menggunakan DatePickerHelper */}
          <div className="flex flex-col">
            <label className="text-xs font-medium text-muted-foreground mb-1">
              Start Date
            </label>
            <DatePickerHelper
              date={exportStartDate}
              setDate={setExportStartDate}
              placeholder="Pilih Start Date"
            />
          </div>

          {/* Filter Tanggal Akhir Menggunakan DatePickerHelper */}
          <div className="flex flex-col">
            <label className="text-xs font-medium text-muted-foreground mb-1">
              End Date
            </label>
            <DatePickerHelper
              date={exportEndDate}
              setDate={setExportEndDate}
              placeholder="Pilih End Date"
            />
          </div>

          {/* Tombol Add Attribute */}
          <Link href="/super-admin/product-attributes/add" className="ml-auto">
            <Button size="sm" className="gap-2 cursor-pointer">
              + Add Attribute
            </Button>
          </Link>

          {/* Tombol Export */}
          <Button
            size="sm"
            className="gap-2 bg-green-600 hover:bg-green-700 cursor-pointer"
            onClick={handleExportAttributes}
            disabled={exporting}>
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            {exporting ? "Preparing..." : "Export to Excel"}
          </Button>
        </div>
      </Card>

      {/* ================= TABLE ================= */}
      <Card className="w-full">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-50">Attribute Name</TableHead>
                <TableHead className="w-32">Type</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Values</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {/* ===== LOADING STATE ===== */}
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-35" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4.5 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-50" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-25" />
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Skeleton className="h-8 w-12.5" />
                        <Skeleton className="h-8 w-15" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-red-500 py-6">
                    Error loading attributes.
                  </TableCell>
                </TableRow>
              ) : attributes.length > 0 ? (
                attributes.map((attr) => (
                  <TableRow key={attr.id}>
                    <TableCell className="font-medium">
                      <div>
                        {attr.name}
                        {attr.parentValue && (
                          <div className="text-xs text-muted-foreground mt-0.5 font-normal">
                            Sub-attribute of:{" "}
                            <span className="font-semibold text-stone-600">
                              {attr.parentValue.attribute.name}
                            </span>{" "}
                            →{" "}
                            <span className="font-semibold text-stone-600">
                              {attr.parentValue.value.includes("|")
                                ? attr.parentValue.value.split("|")[0]
                                : attr.parentValue.value}
                            </span>
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* TYPE */}
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="uppercase font-mono text-xs">
                        {attr.type}
                      </Badge>
                    </TableCell>

                    {/* SCOPE */}
                    <TableCell>
                      {attr.productId && attr.product ? (
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700 border-blue-200">
                          Local: {attr.product.name}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-stone-50 text-stone-700 border-stone-200">
                          Global
                        </Badge>
                      )}
                    </TableCell>

                    {/* VALUES */}
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {attr.values.length > 0 ? (
                          attr.values.map((value) => {
                            const valStr = value.value.includes("|")
                              ? value.value.split("|")[0]
                              : value.value;
                            return (
                              <Badge key={value.id} variant="secondary">
                                {valStr}
                              </Badge>
                            );
                          })
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            No values
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* CREATED */}
                    <TableCell>
                      {formatDate(attr.createdAt, { style: "relative" })}
                    </TableCell>

                    {/* ACTIONS */}
                    <TableCell className="space-x-2">
                      <Link
                        href={`/super-admin/product-attributes/edit/${attr.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="cursor-pointer">
                          Edit
                        </Button>
                      </Link>

                      <Button
                        variant="destructive"
                        size="sm"
                        className="cursor-pointer"
                        onClick={() => setDeleteId(attr.id)}>
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-6 text-muted-foreground">
                    No attributes found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ================= PAGINATION ================= */}
      {meta && (
        <div className="flex justify-between items-center p-4 border-t text-sm text-muted-foreground">
          <p>
            Page {meta.page} of {Math.ceil(meta.total / meta.perPage)}
          </p>

          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!meta.hasPrevious}
              onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Previous
            </Button>

            <Button
              variant="outline"
              size="sm"
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
        warningMessage="Product Attribute tidak dapat dihapus jika sudah digunakan dalam data produk. Pastikan tidak ada produk yang menggunakan atribut ini sebelum menghapus."
      />
    </div>
  );
}
