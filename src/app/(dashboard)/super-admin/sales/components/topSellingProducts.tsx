"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/hooks/useApi";
import { Package, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

// === TYPES SESUAI API BACKEND ===
interface TopProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  sold: number;
  revenue: number;
  image: string | null;
  status: string;
}

const formatIDR = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function TopSellingProducts() {
  const { fetchApi, status } = useApi();

  const [products, setProducts] = useState<TopProduct[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading" || status === "unauthenticated") return;

    const fetchTopProducts = async () => {
      try {
        setLoading(true);

        const res = await fetchApi(`/products/top-selling?limit=5`);

        if (!res.ok) throw new Error("Gagal mengambil data produk terlaris");

        const result = await res.json();
        setProducts(result.data || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopProducts();
  }, [fetchApi, status]);

  return (
    <Card className="shadow-sm h-full border-l-4 border-l-blue-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">
              Top Selling Products
            </CardTitle>
            <CardDescription>
              Produk dengan volume penjualan tertinggi.
            </CardDescription>
          </div>
          <div className="p-2 bg-blue-50 rounded-full">
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))
          ) : products.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Belum ada data penjualan produk.
            </div>
          ) : (
            products.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between hover:bg-slate-50 p-2 rounded-lg transition-colors">
                {/* Bagian Kiri: Info Produk */}
                <div className="flex items-center gap-4">
                  {/* Avatar / Gambar */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border bg-white overflow-hidden relative">
                    {product.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          // Fallback jika URL gambar rusak/expired
                          e.currentTarget.style.display = "none";
                          e.currentTarget.parentElement?.classList.add(
                            "bg-slate-100",
                          );
                        }}
                      />
                    ) : (
                      <Package className="h-6 w-6 text-slate-400" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none line-clamp-1 w-32 sm:w-48">
                      {product.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-mono bg-slate-100 px-1 rounded">
                        {product.sku}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bagian Kanan: Stats Penjualan */}
                <div className="text-right flex flex-col items-end gap-1">
                  <div className="font-semibold text-sm">
                    {formatIDR(product.revenue)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground hidden sm:inline">
                      {product.sold.toLocaleString("id-ID")} Terjual
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 h-4 ${
                        product.status === "Trending"
                          ? "text-green-600 border-green-200 bg-green-50"
                          : product.status === "Slow"
                            ? "text-red-600 border-red-200 bg-red-50"
                            : "text-blue-600 border-blue-200 bg-blue-50"
                      }`}>
                      {product.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
