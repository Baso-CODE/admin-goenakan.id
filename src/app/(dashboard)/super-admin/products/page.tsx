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
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";
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

// === Type definitions for Product (Berdasarkan Skema Baru) ===
type Product = {
  id: string;
  name: string;
  sku: string;
  basePrice: number;
  isCustom: boolean;
  createdAt: string;
  category?: {
    // ✨ 1. Update tipe kategori di dalam produk
    name?: string;
    name_id?: string;
    name_en?: string;
  };

  images?: {
    url: string;
    isFeatured: boolean;
  }[];
};

type Category = {
  id: string;
  // ✨ 2. Update tipe Kategori utama
  name?: string;
  name_id?: string;
  name_en?: string;
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
  const { fetchApi, status } = useApi();

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
      // ✨ Gunakan fetchApi (Otomatis handle Base URL dan Token)
      const res = await fetchApi("/product-categories/list");
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error("Failed to load categories", error);
    }
  };

  // === Fetch data dari backend ===
  const fetchProducts = async () => {
    // 🛑 Jangan jalan jika sesi belum siap
    if (status === "loading") return;

    setLoading(true);
    setError(null);
    try {
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

      // ✨ Gunakan fetchApi (Otomatis handle Base URL dan Token)
      const res = await fetchApi(`/products?${params}`);

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
  }, [fetchApi]); // Tambahkan dependensi fetchApi

  useEffect(() => {
    fetchProducts();
    setExportSearch(debouncedSearch);
  }, [page, debouncedSearch, isCustomFilter, categoryFilter, status, fetchApi]); // Tambahkan status dan fetchApi

  const handleExport = async () => {
    setExporting(true);
    try {
      const exportFilters: ProductExportQuery = {};

      if (exportStartDate) exportFilters.startDate = exportStartDate;
      if (exportEndDate) exportFilters.endDate = exportEndDate;

      if (exportIsCustomFilter !== "ALL")
        exportFilters.isCustom = exportIsCustomFilter as "true" | "false";
      if (exportCategoryId !== "ALL")
        exportFilters.categoryId = exportCategoryId;
      if (exportSearch.trim()) exportFilters.search = exportSearch.trim();

      const queryString = new URLSearchParams(
        exportFilters as Record<string, string>,
      ).toString();

      const response = await fetchApi(`/products/export/excel?${queryString}`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Export failed. Server responded with an error.");
      }

      const blob = await response.blob();
      const filename =
        response.headers
          .get("Content-Disposition")
          ?.match(/filename="(.+)"/)?.[1] || "products_export.xlsx";

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Data Products berhasil di-export ke Excel!");
    } catch (error) {
      console.error("Export Error:", error);
      toast.error(
        "Gagal meng-export data. Pastikan filter sudah benar dan Anda memiliki akses.",
      );
    } finally {
      setExporting(false);
    }
  };

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
                    {/* 🔄 3. Tampilkan nama kategori yang benar di Filter */}
                    {cat.name_id || cat.name || "Unnamed"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

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

      {/* === FILTER DAN EXPORT BARU === */}
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          <h3 className="w-full text-sm font-semibold text-muted-foreground">
            Export Filters:
          </h3>

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

          <Select value={exportCategoryId} onValueChange={setExportCategoryId}>
            <SelectTrigger className="w-50">
              <SelectValue placeholder="Export Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {/* 🔄 4. Tampilkan nama kategori yang benar di Export Filter */}
                  {cat.name_id || cat.name || "Unnamed"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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

          <div className="flex flex-col">
            <label className="text-xs font-medium text-muted-foreground mb-1">
              Search Text
            </label>
            <Input
              type="text"
              placeholder="Uses current search"
              value={exportSearch}
              onChange={(e) => setExportSearch(e.target.value)}
              className="w-50"
            />
          </div>

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
                {loading ? (
                  Array.from({ length: 7 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell className="h-14">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-10 w-10 rounded" />
                          <Skeleton className="h-4 w-45" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-25" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-4 w-25 ml-auto" />
                      </TableCell>
                      <TableCell className="text-center">
                        <Skeleton className="h-5 w-20 mx-auto" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-25" />
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center space-x-2">
                          <Skeleton className="h-8 w-12.5" />
                          <Skeleton className="h-8 w-15" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : error ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
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
                        <TableCell>
                          {/* 🔄 5. Tampilkan nama kategori di dalam Tabel */}
                          {product.category?.name_id ||
                            product.category?.name ||
                            "N/A"}

                          {/* Opsional: Jika admin juga mau lihat nama Inggrisnya */}
                          {product.category?.name_en && (
                            <span className="block text-xs text-gray-400 italic font-normal mt-0.5">
                              {product.category.name_en}
                            </span>
                          )}
                        </TableCell>
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
                            className="text-xs cursor-pointer">
                            <Trash2 className="h-3 w-3 mr-1" /> Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={7}
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
