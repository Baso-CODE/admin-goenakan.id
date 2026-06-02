"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/hooks/useApi";
import { CreditCard, DollarSign, ShoppingBag, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Helper untuk format Rupiah
const formatIDR = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
};

// Helper untuk format Persentase (+/-)
const formatPercent = (val: number) => {
  const sign = val > 0 ? "+" : "";
  return `${sign}${val.toFixed(1)}%`;
};

const getTrendColor = (val: number) => {
  if (val > 0) return "text-green-600";
  if (val < 0) return "text-red-600";
  return "text-muted-foreground";
};

export default function SalesMetrics() {
  const { fetchApi, status } = useApi();

  // === STATE ===
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    revenueChange: 0,
    totalProfit: 0,
    profitChange: 0,
    totalOrders: 0,
    ordersChange: 0,
    totalSpending: 0,
    spendingChange: 0,
  });

  const [loading, setLoading] = useState(true);

  // === FETCH API ===
  useEffect(() => {
    if (status === "loading" || status === "unauthenticated") return;
    const fetchMetrics = async () => {
      try {
        setLoading(true);

        // 2. Panggil Endpoint Analytics
        const res = await fetchApi(`/orders/analytics/metrics`);

        if (!res.ok) throw new Error("Gagal mengambil data metrics");

        const json = await res.json();

        // Simpan data ke state
        setMetrics(json.data);
      } catch (error) {
        console.error("Error fetching metrics:", error);
        toast.error("Gagal memuat ringkasan penjualan");
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [fetchApi, status]);

  // === RENDER LOADING (SKELETON) ===
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" /> {/* Title Skeleton */}
              <Skeleton className="h-4 w-4 rounded-full" />
              {/* Icon Skeleton */}
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-2" /> {/* Value Skeleton */}
              <Skeleton className="h-3 w-20" /> {/* Subtext Skeleton */}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // === RENDER DATA ===
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* CARD 1: TOTAL REVENUE */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatIDR(metrics.totalRevenue)}
          </div>
          <p className={`text-xs ${getTrendColor(metrics.revenueChange)}`}>
            {formatPercent(metrics.revenueChange)} dari bulan lalu
          </p>
        </CardContent>
      </Card>

      {/* CARD 2: TOTAL PROFIT */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatIDR(metrics.totalProfit)}
          </div>
          <p className={`text-xs ${getTrendColor(metrics.profitChange)}`}>
            {formatPercent(metrics.profitChange)} dari bulan lalu
          </p>
        </CardContent>
      </Card>

      {/* CARD 3: TOTAL ORDERS */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          <ShoppingBag className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics.totalOrders.toLocaleString("id-ID")}
          </div>
          <p className="text-xs text-muted-foreground">
            {/* Logic plus sign untuk order */}
            {metrics.ordersChange >= 0 ? "+" : ""}
            {metrics.ordersChange} order baru bulan ini
          </p>
        </CardContent>
      </Card>

      {/* CARD 4: TOTAL SPENDING */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Spending</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatIDR(metrics.totalSpending)}
          </div>
          <p className="text-xs text-muted-foreground">
            Pengeluaran Operasional & Modal
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
