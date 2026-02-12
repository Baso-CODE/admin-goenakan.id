"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, DollarSign, ShoppingBag, TrendingUp } from "lucide-react";

// Helper untuk format Rupiah
const formatIDR = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function SalesMetrics() {
  // DUMMY DATA
  const metrics = {
    totalRevenue: 1250000000, // 1.25 M
    totalProfit: 450000000, // 450 Jt
    totalOrders: 1245,
    totalSpending: 800000000, // 800 Jt
  };

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
          <p className="text-xs text-muted-foreground">
            +20.1% dari bulan lalu
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
          <p className="text-xs text-muted-foreground">
            +15.3% dari bulan lalu
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
            +180 order baru minggu ini
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
            Pengeluaran bahan baku & operasional
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
