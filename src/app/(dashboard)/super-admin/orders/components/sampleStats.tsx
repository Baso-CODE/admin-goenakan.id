"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApi } from "@/hooks/useApi";
import {
  ArrowUpRight,
  BadgeDollarSign,
  FlaskConical,
  Percent,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Interface state internal
interface StatsData {
  totalCount: number;
  totalCost: number;
  conversionRate: number;
}

export default function SampleStats() {
  const { fetchApi, status } = useApi();

  // 1. STATE INTERNAL
  const [stats, setStats] = useState<StatsData>({
    totalCount: 0,
    totalCost: 0,
    conversionRate: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // 2. FETCH DATA OTOMATIS SAAT COMPONENT MUNCUL
  useEffect(() => {
    const fetchStats = async () => {
      if (status !== "authenticated") return;

      try {
        setIsLoading(true);

        const res = await fetchApi("/orders/stats/sample");

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || "Gagal mengambil data statistik");
        }

        const result = await res.json();

        // Pastikan structure data sesuai dengan return API backend
        setStats(
          result.data || { totalCount: 0, totalCost: 0, conversionRate: 0 },
        );
      } catch (error) {
        console.error(error);
        toast.error("Gagal memuat statistik sample");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [status, fetchApi]); // Tambahkan dependensi lengkap

  // Helper Format Currency
  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // 3. RENDER SKELETON (LOADING STATE)
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
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
    <div className="grid gap-4 md:grid-cols-3">
      {/* CARD 1: TOTAL SAMPLES */}
      <Card className="shadow-sm border-l-4 border-l-purple-500 bg-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Samples Sent
          </CardTitle>
          <FlaskConical className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalCount}</div>
          <p className="text-xs text-muted-foreground">
            Total sample orders created
          </p>
        </CardContent>
      </Card>

      {/* CARD 2: TOTAL COST */}
      <Card className="shadow-sm border-l-4 border-l-red-500 bg-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Sample Cost
          </CardTitle>
          <BadgeDollarSign className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatIDR(stats.totalCost)}</div>
          <p className="text-xs text-muted-foreground">
            Accumulated cost of samples
          </p>
        </CardContent>
      </Card>

      {/* CARD 3: CONVERSION RATE */}
      <Card className="shadow-sm border-l-4 border-l-green-500 bg-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Conversion Rate
          </CardTitle>
          <div className="flex items-center gap-1">
            <Percent className="h-4 w-4 text-green-600" />
            <ArrowUpRight className="h-3 w-3 text-green-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.conversionRate}%</div>
          <p className="text-xs text-muted-foreground">
            Samples converted to real orders
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
