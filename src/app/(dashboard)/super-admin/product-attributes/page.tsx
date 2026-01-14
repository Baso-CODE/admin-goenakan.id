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

import { useDebounce } from "@/helper/debounce";
import { formatDate } from "@/utils/formatDate";
import { FileDown, Loader2, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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
};

type Meta = {
  hasNext: boolean;
  hasPrevious: boolean;
  page: number;
  perPage: number;
  total: number;
};

// Interface untuk Query Export (sesuai kebutuhan backend)
interface AttributeExportQuery {
  startDate?: string;
  endDate?: string;
  search?: string;
}

export default function ProductAttributesPage() {
  // --- STATE UNTUK TABLE ---
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [page, setPage] = useState(1);

  // --- STATE BARU UNTUK EXPORT FILTER ---
  const [exportStartDate, setExportStartDate] = useState<string>("");
  const [exportEndDate, setExportEndDate] = useState<string>("");
  const [exportSearch, setExportSearch] = useState<string>(""); // Tambahkan state search untuk export
  const [exporting, setExporting] = useState<boolean>(false); // State untuk loading button export

  // --- FUNGSI FETCH DATA (Untuk Tabel) ---
  const fetchAttributes = async () => {
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

      const res = await fetch(
        `http://localhost:8000/product-attributes?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);

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

  // --- FUNGSI HANDLE EXPORT (Implementasi Baru) ---
  const handleExportAttributes = async () => {
    setExporting(true);
    try {
      // 1. Ambil Token Autentikasi
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      // 2. Kumpulkan Filter
      const exportFilters: AttributeExportQuery = {
        ...(exportStartDate && { startDate: exportStartDate }),
        ...(exportEndDate && { endDate: exportEndDate }),
        // Gunakan nilai search dari filter export
        ...(exportSearch.trim() && { search: exportSearch.trim() }),
      };

      const queryString = new URLSearchParams(
        exportFilters as Record<string, string>
      ).toString();

      // Endpoint untuk export (Sesuaikan dengan endpoint backend Anda: /product-attributes/export/excel)
      const exportUrl = `http://localhost:8000/product-attributes/export/excel?${queryString}`;

      const response = await fetch(exportUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server Error:", errorText);
        throw new Error("Export failed. Server responded with an error.");
      }

      // 3. Proses File Binary (Blob)
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
        "Gagal meng-export data. Pastikan endpoint backend sudah siap."
      );
    } finally {
      setExporting(false);
    }
  };
  // --- END FUNGSI HANDLE EXPORT ---

  useEffect(() => {
    fetchAttributes();
  }, [page, debouncedSearch]);

  return (
    <div className="space-y-4 w-auto mx-auto">
      {/* ================= HEADER & SEARCH/FILTER TABLE ================= */}
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
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* ================= FILTER DAN EXPORT BARU ================= */}
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          <h3 className="w-full text-sm font-semibold text-muted-foreground">
            Export Filter (opsional, berdasarkan Created Date):
          </h3>

          {/* Filter Search (untuk Export) */}
          <div className="flex flex-col">
            <label className="text-xs font-medium text-muted-foreground mb-1">
              Search (Export)
            </label>
            <Input
              type="text"
              placeholder="Search by name/slug..."
              value={exportSearch}
              onChange={(e) => setExportSearch(e.target.value)}
              className="w-50"
            />
          </div>

          {/* Filter Tanggal Mulai (Untuk Export) */}
          <div className="flex flex-col">
            <label className="text-xs font-medium text-muted-foreground mb-1">
              Start Date
            </label>
            <Input
              type="date"
              value={exportStartDate}
              onChange={(e) => setExportStartDate(e.target.value)}
              className="w-37.5"
            />
          </div>

          {/* Filter Tanggal Akhir (Untuk Export) */}
          <div className="flex flex-col">
            <label className="text-xs font-medium text-muted-foreground mb-1">
              End Date
            </label>
            <Input
              type="date"
              value={exportEndDate}
              onChange={(e) => setExportEndDate(e.target.value)}
              className="w-37.5"
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
            className="gap-2 bg-green-600 hover:bg-green-700" // Warna kustom untuk Attributes
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
      {/* ================= END FILTER DAN EXPORT BARU ================= */}

      {/* ================= TABLE ================= */}
      <Card className="w-full">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-50">Attribute Name</TableHead>
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
                      <Skeleton className="h-4 w-[140px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-50" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-25" />
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Skeleton className="h-8 w-[50px]" />
                        <Skeleton className="h-8 w-[60px]" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-red-500 py-6">
                    Error loading attributes.
                  </TableCell>
                </TableRow>
              ) : attributes.length > 0 ? (
                attributes.map((attr) => (
                  <TableRow key={attr.id}>
                    <TableCell className="font-medium">{attr.name}</TableCell>

                    {/* VALUES */}
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {attr.values.length > 0 ? (
                          attr.values.map((value) => (
                            <Badge key={value.id} variant="secondary">
                              {value.value}
                            </Badge>
                          ))
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
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </Link>

                      <Button variant="destructive" size="sm">
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
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
    </div>
  );
}
