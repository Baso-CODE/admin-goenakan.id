"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import { Switch } from "@/components/ui/switch";
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
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";
import { DropdownMenu } from "@radix-ui/react-dropdown-menu";
import { format } from "date-fns";
import {
  FileDown,
  Globe,
  Loader2,
  MoreHorizontal,
  Package,
  Pencil,
  ScanEye,
  Search,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ProductSeoForm } from "./productSeoForm";

type Product = {
  id: string;
  name: string;
  sku: string;
  basePrice: number;
  isCustom: boolean;
  isActive?: boolean;
  createdAt: string;
  category?: {
    name?: string;
    name_id?: string;
    name_en?: string;
  };

  images?: {
    id: string;
    url: string;
    isFeatured: boolean;
  }[];

  isMultiFace?: boolean;
  mockupFrontImageId?: string | null;
  mockupBackImageId?: string | null;
};

type Category = {
  id: string;
  //  2. Update tipe Kategori utama
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

export default function ProductsAll() {
  const { fetchApi, status } = useApi();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const handleToggleActive = async (
    productId: string,
    currentStatus: boolean,
  ) => {
    try {
      const res = await fetchApi(`/products/${productId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      if (!res.ok) {
        throw new Error("Gagal mengubah status aktif produk");
      }
      toast.success("Status aktif produk berhasil diubah");
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, isActive: !currentStatus } : p,
        ),
      );
    } catch (err: any) {
      toast.error(err.message || "Gagal mengubah status aktif");
    }
  };

  // === State Filter Gabungan ===
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isCustomFilter, setIsCustomFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  const debouncedSearch = useDebounce(search, 500);

  // === Fetch Categories ===
  const fetchCategories = async () => {
    try {
      const res = await fetchApi("/product-categories/list");
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error("Failed to load categories", error);
    }
  };

  // === Fetch Products ===
  const fetchProducts = async () => {
    if (status === "loading") return;

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        take: "10",
      });

      if (isCustomFilter !== "ALL") params.append("isCustom", isCustomFilter);
      if (categoryFilter !== "ALL") params.append("categoryId", categoryFilter);
      if (debouncedSearch.trim())
        params.append("search", debouncedSearch.trim());

      // Tambahkan filter tanggal jika ada
      if (startDate)
        params.append("startDate", format(startDate, "yyyy-MM-dd"));
      if (endDate) params.append("endDate", format(endDate, "yyyy-MM-dd"));

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
  }, [fetchApi]);

  useEffect(() => {
    fetchProducts();
  }, [
    page,
    debouncedSearch,
    isCustomFilter,
    categoryFilter,
    startDate,
    endDate,
    status,
    fetchApi,
  ]);

  // === Handle Export ===
  const handleExport = async () => {
    setExporting(true);
    try {
      const exportFilters: Record<string, string> = {};

      // Menggunakan state filter utama
      if (startDate) exportFilters.startDate = format(startDate, "yyyy-MM-dd");
      if (endDate) exportFilters.endDate = format(endDate, "yyyy-MM-dd");
      if (isCustomFilter !== "ALL") exportFilters.isCustom = isCustomFilter;
      if (categoryFilter !== "ALL") exportFilters.categoryId = categoryFilter;
      if (debouncedSearch.trim()) exportFilters.search = debouncedSearch.trim();

      const queryString = new URLSearchParams(exportFilters).toString();

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
        <CardHeader className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <CardTitle className="text-2xl font-bold whitespace-nowrap flex items-center gap-2">
            <Package className="h-7 w-7 font-bold" />
            Product Management
          </CardTitle>

          <div className="flex gap-2 ml-auto">
            <Link href="/super-admin/products-v2/add">
              <Button size="sm" className="gap-2">
                + Add Product
              </Button>
            </Link>
            <Button
              size="sm"
              className="gap-2 bg-green-600 hover:bg-green-700"
              onClick={handleExport}
              disabled={exporting}>
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4" />
              )}
              {exporting ? "Exporting..." : "Export Excel"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Baris Filter */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search name or SKU..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-8 w-60"
              />
            </div>

            <Select
              value={isCustomFilter}
              onValueChange={(val) => {
                setIsCustomFilter(val);
                setPage(1);
              }}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Type" />
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
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name_id || cat.name || "Unnamed"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

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

            {(startDate ||
              endDate ||
              isCustomFilter !== "ALL" ||
              categoryFilter !== "ALL" ||
              search) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStartDate(undefined);
                  setEndDate(undefined);
                  setIsCustomFilter("ALL");
                  setCategoryFilter("ALL");
                  setSearch("");
                  setPage(1);
                }}
                className="text-muted-foreground hover:text-foreground">
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* <div className="p-1 flex justify-start">
        <Link href="/super-admin/products-v2/add">
          <Button size="sm" className="gap-2">
            + Add Product
          </Button>
        </Link>
      </div> */}

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
                  <TableHead className="text-center">Status</TableHead>
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
                      <TableCell className="text-center">
                        <Skeleton className="h-5 w-16 mx-auto" />
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
                      colSpan={8}
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
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            <Switch
                              checked={product.isActive !== false}
                              onCheckedChange={() =>
                                handleToggleActive(
                                  product.id,
                                  product.isActive !== false,
                                )
                              }
                              className="scale-90"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatDate(product.createdAt, { style: "relative" })}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Bungkus semuanya di dalam komponen Dialog */}
                            <Dialog>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  {/* Tombol Titik Tiga */}
                                  <Button
                                    variant="ghost"
                                    className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4 text-slate-500" />
                                  </Button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent
                                  align="end"
                                  className="w-48">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />

                                  {/* ACTION: DETAIL */}
                                  <DropdownMenuItem
                                    asChild
                                    className="cursor-pointer">
                                    <Link
                                      href={`/super-admin/products-v2/detail/${product.id}`}>
                                      <ScanEye className="mr-2 h-4 w-4 text-blue-500" />
                                      <span>Detail</span>
                                    </Link>
                                  </DropdownMenuItem>

                                  {/* ACTION: EDIT */}
                                  <DropdownMenuItem
                                    asChild
                                    className="cursor-pointer">
                                    <Link
                                      href={`/super-admin/products-v2/update/${product.id}`}>
                                      <Pencil className="mr-2 h-4 w-4 text-orange-500" />
                                      <span>Edit</span>
                                    </Link>
                                  </DropdownMenuItem>

                                  {/* ACTION: EDIT SEO (Membuka Modal) */}
                                  <DialogTrigger asChild>
                                    <DropdownMenuItem
                                      className="cursor-pointer"
                                      // Penting: mencegah dropdown menutup secara brutal dan memblokir modal
                                      onSelect={(e) => e.preventDefault()}>
                                      <Globe className="mr-2 h-4 w-4 text-emerald-600" />
                                      <span>Edit SEO</span>
                                    </DropdownMenuItem>
                                  </DialogTrigger>

                                  <DropdownMenuSeparator />

                                  {/* ACTION: DELETE */}
                                  <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Delete</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>

                              {/* ISI MODAL UNTUK SEO FORM */}
                              <DialogContent className="max-w-5xl overflow-y-auto max-h-[90vh]">
                                <DialogHeader>
                                  <DialogTitle className="text-xl">
                                    Setup Product SEO
                                  </DialogTitle>
                                </DialogHeader>

                                {/* Panggil komponen Form SEO-mu di sini, lempar ID produknya */}
                                <div className="mt-4">
                                  <ProductSeoForm productId={product.id} />
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={8}
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
}
