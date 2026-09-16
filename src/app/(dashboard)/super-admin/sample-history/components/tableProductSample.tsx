"use client";

import { Eye, Package, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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
import { useApi } from "@/hooks/useApi";

// Tipe data berdasarkan return dari service getAllSampleProducts
type ProductSample = {
  id: string;
  name: string;
  sku: string;
  stock: number;
  basePrice: string | number;
  _count: {
    sampleHistories: number;
  };
};

type Meta = {
  hasNext: boolean;
  hasPrevious: boolean;
  page: number;
  perPage: number;
  total: number;
};

// Fungsi helper untuk memformat harga (Rupiah)
const formatCurrency = (amount: number | string) => {
  const numericAmount =
    typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(numericAmount || 0);
};

export default function TableProductSample() {
  const { fetchApi, status } = useApi();

  const [products, setProducts] = useState<ProductSample[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 900);
  const [page, setPage] = useState(1);

  const fetchProducts = async () => {
    if (status !== "authenticated") return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        take: "10",
      });

      if (debouncedSearch) params.append("search", debouncedSearch);

      // Memanggil endpoint baru yang kita buat untuk produk sampel
      const res = await fetchApi(`/sample-history/products?${params}`);

      if (!res.ok) {
        throw new Error("Failed to fetch product samples");
      }

      const result = await res.json();
      setProducts(result.data || []);
      setMeta(result.meta);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat daftar produk sampel");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, debouncedSearch, status, fetchApi]);

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden mx-auto pb-10 mt-6">
      <Card className="border-l-4 border-l-primary shadow-sm">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">
                Daftar Produk Sampel
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Daftar Master SKU (Produk) yang bisa digunakan untuk peminjaman
                sampel.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {/* Filter Search */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari Nama Produk / SKU..."
                className="pl-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="shadow-sm border-t-0 w-full overflow-hidden mt-2">
        <CardContent className="p-0">
          <div className="rounded-md border overflow-x-auto w-full">
            <Table className="whitespace-nowrap min-w-full">
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-20">No</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Nama Produk</TableHead>
                  <TableHead>Harga Dasar</TableHead>
                  <TableHead>Stok Tersedia</TableHead>
                  <TableHead>Total Transaksi Sampel</TableHead>
                  <TableHead className="text-center sticky right-0 bg-white shadow-[-10px_0_15px_-5px_rgba(0,0,0,0.05)]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, col) => (
                        <TableCell key={col}>
                          <Skeleton className="h-5 w-full" />
                        </TableCell>
                      ))}
                      <TableCell className="sticky right-0 bg-white">
                        <Skeleton className="h-8 w-24 mx-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : products.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-24 text-center text-muted-foreground">
                      Tidak ada produk sampel yang ditemukan.
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product, index) => (
                    <TableRow key={product.id} className="hover:bg-muted/5">
                      <TableCell className="text-muted-foreground">
                        {/* Menghitung nomor urut berdasarkan pagination */}
                        {meta
                          ? (meta.page - 1) * meta.perPage + index + 1
                          : index + 1}
                      </TableCell>
                      <TableCell className="font-mono font-medium text-primary">
                        {product.sku}
                      </TableCell>
                      <TableCell className="font-medium text-gray-800">
                        {product.name}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatCurrency(product.basePrice)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            product.stock > 0 ? "outline" : "destructive"
                          }
                          className={
                            product.stock > 0
                              ? "bg-green-50 text-green-700 border-green-200"
                              : ""
                          }>
                          {product.stock} pcs
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium text-muted-foreground bg-slate-100 px-2 py-1 rounded-md">
                          {product._count.sampleHistories} aktivitas
                        </span>
                      </TableCell>
                      <TableCell className="text-center sticky right-0 bg-white shadow-[-10px_0_15px_-5px_rgba(0,0,0,0.05)]">
                        {/* Tombol Lihat Detail (Akan mengarah ke halaman summary khusus produk ini) */}
                        <Link
                          href={`/super-admin/sample-history/sample-products/${product.id}`}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-blue-600 border-blue-200 hover:bg-blue-50 cursor-pointer w-full max-w-30 mx-auto">
                            <Eye className="w-4 h-4 mr-1.5" />
                            Detail SKU
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination Footer */}
      {meta && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-muted-foreground">
            Menampilkan Halaman <strong>{meta.page}</strong> dari{" "}
            <strong>{Math.ceil(meta.total / meta.perPage) || 1}</strong> (
            {meta.total} total produk)
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!meta.hasPrevious}
              onClick={() => setPage((p) => p - 1)}>
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
