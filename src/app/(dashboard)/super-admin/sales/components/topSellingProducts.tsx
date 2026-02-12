"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Package, TrendingUp } from "lucide-react";

// Helper formatter
const formatIDR = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function TopSellingProducts() {
  // DUMMY DATA: 5 Produk Terlaris
  const topProducts = [
    {
      id: "1",
      name: "Kaos Polos Cotton Combed 30s",
      sku: "TS-POLOS-01",
      category: "Apparel",
      sold: 1250,
      revenue: 43750000,
      status: "Trending",
    },
    {
      id: "2",
      name: "Kemeja Flanel Premium",
      sku: "KM-FLNL-02",
      category: "Apparel",
      sold: 850,
      revenue: 127500000,
      status: "Stable",
    },
    {
      id: "3",
      name: "Hoodie Jumper Fleece",
      sku: "HD-JMP-01",
      category: "Outerwear",
      sold: 620,
      revenue: 93000000,
      status: "Trending",
    },
    {
      id: "4",
      name: "Topi Baseball Custom",
      sku: "TP-BASE-01",
      category: "Accessories",
      sold: 540,
      revenue: 162000000, // Misal ini pesanan partai besar
      status: "Stable",
    },
    {
      id: "5",
      name: "Totebag Canvas Premium",
      sku: "TB-CNV-03",
      category: "Accessories",
      sold: 430,
      revenue: 21500000,
      status: "Down",
    },
  ];

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">
              Top Selling Products
            </CardTitle>
            <CardDescription>
              Produk dengan volume penjualan tertinggi bulan ini.
            </CardDescription>
          </div>
          <div className="p-2 bg-blue-50 rounded-full">
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {topProducts.map((product, index) => (
            <div key={product.id} className="flex items-center justify-between">
              {/* Bagian Kiri: Info Produk */}
              <div className="flex items-center gap-4">
                {/* Avatar / Icon Placeholder */}
                <div className="flex h-12 w-12 items-center justify-center rounded-lg border bg-slate-50">
                  <Package className="h-6 w-6 text-slate-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {product.name}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-mono">{product.sku}</span>
                    <span>•</span>
                    <span>{product.category}</span>
                  </div>
                </div>
              </div>

              {/* Bagian Kanan: Stats Penjualan */}
              <div className="text-right flex flex-col items-end gap-1">
                <div className="font-semibold text-sm">
                  {formatIDR(product.revenue)}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {product.sold.toLocaleString("id-ID")} Terjual
                  </span>
                  {/* Badge Indikator Status */}
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 h-4 ${
                      product.status === "Trending"
                        ? "text-green-600 border-green-200 bg-green-50"
                        : product.status === "Down"
                          ? "text-red-600 border-red-200 bg-red-50"
                          : "text-slate-600 border-slate-200 bg-slate-50"
                    }`}>
                    {product.status}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
