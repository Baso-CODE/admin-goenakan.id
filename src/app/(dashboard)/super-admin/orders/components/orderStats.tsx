"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiUrl } from "@/helper/apiurl";
import { Clock, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Interface state internal
interface OrderStatsData {
  totalOrders: number;
  ongoingOrders: number;
}

export default function OrderStats() {
  // 1. STATE INTERNAL
  const [stats, setStats] = useState<OrderStatsData>({
    totalOrders: 0,
    ongoingOrders: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // 2. FETCH DATA OTOMATIS
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const tokenRes = await fetch("/api/auth/token");
        const { token } = await tokenRes.json();

        // Mengarah ke endpoint statistik umum (bukan sample)
        // Pastikan endpoint ini dibuat di backend (lihat instruksi di bawah)
        const res = await fetch(`${apiUrl}/orders/stats/general`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Gagal mengambil data statistik order");

        const result = await res.json();

        setStats(result.data || { totalOrders: 0, ongoingOrders: 0 });
      } catch (error) {
        console.error(error);
        toast.error("Gagal memuat statistik order");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  // 3. RENDER SKELETON (LOADING STATE - HANYA 2 KOTAK)
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-gray-200 rounded"></div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-32 bg-gray-200 rounded mb-1"></div>
              <div className="h-3 w-40 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // 4. RENDER DATA ASLI
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* CARD 1: TOTAL ALL ORDERS */}
      <Card className="shadow-sm border-l-4 border-l-blue-500 bg-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Orders
          </CardTitle>
          <ShoppingBag className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalOrders}</div>
          <p className="text-xs text-muted-foreground">
            Semua order yang masuk (Sales & Sample)
          </p>
        </CardContent>
      </Card>

      {/* CARD 2: ON GOING ORDERS (Status Active) */}
      <Card className="shadow-sm border-l-4 border-l-orange-500 bg-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            On-Going Orders
          </CardTitle>
          <Clock className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.ongoingOrders}</div>
          <p className="text-xs text-muted-foreground">
            Order yang sedang diproses (Belum Selesai)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
