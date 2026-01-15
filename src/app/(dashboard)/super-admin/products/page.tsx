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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileDown,
  Loader2,
  Package,
  Pencil,
  ScanEye,
  Search,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
// Asumsi Anda memiliki utilitas ini di proyek Anda
import { Skeleton } from "@/components/ui/skeleton";
import { apiUrl } from "@/helper/apiurl";
import { useDebounce } from "@/helper/debounce";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";

// === Type definitions for Product (Berdasarkan Skema Baru) ===
type Product = {
  id: string;
  name: string;
  sku: string;
  basePrice: number;
  isCustom: boolean;
  createdAt: string;
  category?: {
    name: string;
  };

  images?: {
    url: string;
    isFeatured: boolean;
  }[];
};

type Category = {
  id: string;
  name: string;
};

type Meta = {
  hasNext: boolean;
  hasPrevious: boolean;
  page: number;
  perPage: number;
  total: number;
};

interface ProductExportQuery {
  startDate?: string;
  endDate?: string;
  search?: string;
  categoryId?: string;
  isCustom?: "true" | "false" | "ALL";
}
const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isCustomFilter, setIsCustomFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  const [exportStartDate, setExportStartDate] = useState<string>("");
  const [exportEndDate, setExportEndDate] = useState<string>("");
  const [exportCategoryId, setExportCategoryId] = useState<string>("ALL");
  const [exportIsCustomFilter, setExportIsCustomFilter] =
    useState<string>("ALL");
  const [exportSearch, setExportSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500);

  // === Fetch Categories ===
  const fetchCategories = async () => {
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      const res = await fetch(`${apiUrl}/product-categories/list`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error("Failed to load categories", error);
    }
  };

  // === Fetch data dari backend ===
  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      const params = new URLSearchParams({
        page: page.toString(),
        take: "10",
      });

      if (isCustomFilter !== "ALL") {
        params.append("isCustom", isCustomFilter);
      }
      if (categoryFilter !== "ALL") params.append("categoryId", categoryFilter);
      if (debouncedSearch.trim()) {
        params.append("search", debouncedSearch.trim());
      }

      // Ganti endpoint ke /products
      const res = await fetch(`${apiUrl}/products?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Failed to fetch product data.");
      }

      setProducts(result.data || []);
      setMeta(result.meta);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unknown error");
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
    setExportSearch(debouncedSearch);
  }, [page, debouncedSearch, isCustomFilter, categoryFilter]);

  const handleExport = async () => {
    setExporting(true);
    try {
      // 1. Ambil Token Autentikasi
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      // 2. Kumpulkan Filter Export
      const exportFilters: ProductExportQuery = {};

      if (exportStartDate) exportFilters.startDate = exportStartDate;
      if (exportEndDate) exportFilters.endDate = exportEndDate;

      // Filter yang berasal dari filter tampilan utama juga dapat digunakan (opsional)
      // Disini kita menggunakan filter Export yang terpisah
      if (exportIsCustomFilter !== "ALL")
        exportFilters.isCustom = exportIsCustomFilter as "true" | "false";
      if (exportCategoryId !== "ALL")
        exportFilters.categoryId = exportCategoryId;
      if (exportSearch.trim()) exportFilters.search = exportSearch.trim();

      const queryString = new URLSearchParams(
        exportFilters as Record<string, string>
      ).toString();

      // PASTIKAN URL INI SESUAI DENGAN ROUTE BACKEND ANDA!
      // Endpoint: /products/export/excel
      const exportUrl = `${apiUrl}/products/export/excel?${queryString}`;

      const response = await fetch(exportUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Export failed. Server responded with an error.");
      }

      // 3. Proses File Binary (Blob)
      const blob = await response.blob();
      // Coba ambil nama file dari header, default jika tidak ada
      const filename =
        response.headers
          .get("Content-Disposition")
          ?.match(/filename="(.+)"/)?.[1] || "products_export.xlsx";

      // Membuat URL objek untuk file yang akan diunduh
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename; // Nama file download
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url); // Bersihkan URL

      toast.success("Data Products berhasil di-export ke Excel!");
    } catch (error) {
      console.error("Export Error:", error);
      toast.error(
        "Gagal meng-export data. Pastikan filter sudah benar dan Anda memiliki akses."
      );
    } finally {
      setExporting(false);
    }
  };
  // === RENDER ===
  return (
    <div className="space-y-4 overflow-x-hidden w-full mx-auto">
      {/* === Header === */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 overflow-x-auto">
          <CardTitle className="text-2xl font-bold whitespace-nowrap flex items-center gap-2">
            <Package className="h-7 w-7 font-bold" />
            Product Management
          </CardTitle>

          <div className="flex flex-wrap gap-3">
            {/* Filter Type */}
            <Select
              value={isCustomFilter}
              onValueChange={(val) => {
                setIsCustomFilter(val);
                setPage(1);
              }}>
              <SelectTrigger className="w-37.5">
                <SelectValue placeholder="Filter Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="false">Standard</SelectItem>
                <SelectItem value="true">Custom</SelectItem>
              </SelectContent>
            </Select>

            {/* Filter Category */}
            <Select
              value={categoryFilter}
              onValueChange={(val) => {
                setCategoryFilter(val);
                setPage(1);
              }}>
              <SelectTrigger className="w-50">
                <SelectValue placeholder="Filter Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search name or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 w-62.5"
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      <hr />

      {/* === FILTER DAN EXPORT BARU (Sama seperti Vendor Items) === */}
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          <h3 className="w-full text-sm font-semibold text-muted-foreground">
            Export Filters:
          </h3>

          {/* Filter Type untuk Export */}
          <Select
            value={exportIsCustomFilter}
            onValueChange={setExportIsCustomFilter}>
            <SelectTrigger className="w-37.5">
              <SelectValue placeholder="Export Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="false">Standard</SelectItem>
              <SelectItem value="true">Custom</SelectItem>
            </SelectContent>
          </Select>

          {/* Filter Category ID untuk Export */}
          <Select value={exportCategoryId} onValueChange={setExportCategoryId}>
            <SelectTrigger className="w-50">
              <SelectValue placeholder="Export Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filter Tanggal Mulai */}
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

          {/* Filter Tanggal Akhir */}
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

          {/* Search Export (Menggunakan debouncedSearch dari filter utama) */}
          <div className="flex flex-col">
            <label className="text-xs font-medium text-muted-foreground mb-1">
              Search Text
            </label>
            <Input
              type="text"
              placeholder="Uses current search"
              value={exportSearch} // Tampilkan nilai debounced
              onChange={(e) => setExportSearch(e.target.value)}
              className="w-50"
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
      {/* === Button Add Product === */}
      <div className="p-1 flex justify-start">
        <Link href="/super-admin/products/add">
          <Button size="sm" className="gap-2">
            + Add Product
          </Button>
        </Link>
      </div>

      {/* === Table === */}
      <Card className="w-full">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-75">Product Name</TableHead>
                  <TableHead className="w-30">SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Base Price</TableHead>
                  <TableHead className="text-center">Type</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-center w-37.5">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Penanganan Loading menggunakan Skeleton */}
                {loading ? (
                  Array.from({ length: 7 }).map((_, index) => (
                    <TableRow key={index}>
                      {/* 1. Name */}
                      <TableCell className="h-14">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-10 w-10 rounded" />
                          <Skeleton className="h-4 w-45" />
                        </div>
                      </TableCell>
                      {/* 2. SKU */}
                      <TableCell>
                        <Skeleton className="h-4 w-25" />
                      </TableCell>
                      {/* 3. Category */}
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      {/* 4. Price */}
                      <TableCell className="text-right">
                        <Skeleton className="h-4 w-25 ml-auto" />
                      </TableCell>
                      {/* 5. Type */}
                      <TableCell className="text-center">
                        <Skeleton className="h-5 w-20 mx-auto" />
                      </TableCell>
                      {/* 6. Created */}
                      <TableCell>
                        <Skeleton className="h-4 w-25" />
                      </TableCell>
                      {/* 7. Actions */}
                      <TableCell className="text-center">
                        <div className="flex justify-center space-x-2">
                          <Skeleton className="h-8 w-12.5" />
                          <Skeleton className="h-8 w-15" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : error ? (
                  /* Penanganan Error */
                  <TableRow>
                    <TableCell
                      colSpan={7} // Sesuaikan colSpan
                      className="text-center text-red-500 py-6">
                      Error: {error || "Failed to load products."}
                    </TableCell>
                  </TableRow>
                ) : products.length > 0 ? (
                  products.map((product) => {
                    const thumbnail =
                      product.images?.find((img) => img.isFeatured) ||
                      product.images?.[0];

                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            {thumbnail ? (
                              <img
                                src={thumbnail.url}
                                alt={product.name}
                                className="h-10 w-10 rounded-md object-cover border"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-md bg-gray-100 flex items-center justify-center">
                                <Package className="h-5 w-5 text-gray-400" />
                              </div>
                            )}
                            <span className="truncate">{product.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {product.sku}
                        </TableCell>
                        <TableCell>{product.category?.name || "N/A"}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(product.basePrice)}
                        </TableCell>
                        <TableCell className="text-center">
                          {product.isCustom ? (
                            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                              Custom
                            </Badge>
                          ) : (
                            <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                              Standard
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {formatDate(product.createdAt, { style: "relative" })}
                        </TableCell>
                        <TableCell className="text-center space-x-2">
                          <Link
                            href={`/super-admin/products/detail/${product.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="cursor-pointer">
                              <ScanEye className="h-3 w-3 mr-1" /> Detail
                            </Button>
                          </Link>
                          <Link
                            href={`/super-admin/products/update/${product.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="cursor-pointer">
                              <Pencil className="h-3 w-3 mr-1" /> Edit
                            </Button>
                          </Link>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="text-xs cursor-pointer"
                            // onClick={() => handleDelete(product.id)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" /> Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  /* Data Kosong */
                  <TableRow>
                    <TableCell
                      colSpan={7} // Sesuaikan colSpan
                      className="text-center py-6 text-muted-foreground">
                      No products found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* === Pagination === */}
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
    </div>
  );
};

export default Products;
