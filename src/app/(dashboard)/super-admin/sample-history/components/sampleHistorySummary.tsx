"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApi } from "@/hooks/useApi";
import { PackageCheck, Truck, Warehouse } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface SampleSummaryData {
  atWarehouse: number;
  inTransit: number;
  atClient: number;
}

export default function SampleHistorySummary() {
  const { fetchApi, status } = useApi();

  const [stats, setStats] = useState<SampleSummaryData>({
    atWarehouse: 0,
    inTransit: 0,
    atClient: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (status !== "authenticated") return;

      try {
        setIsLoading(true);
        // Sesuaikan dengan prefix URL router kamu
        const res = await fetchApi("/sample-history/summary");

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || "Gagal mengambil summary sample");
        }

        const result = await res.json();
        setStats(result.data || { atWarehouse: 0, inTransit: 0, atClient: 0 });
      } catch (error) {
        console.error(error);
        toast.error("Gagal memuat statistik sample history");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [status, fetchApi]);

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
              <div className="h-8 w-16 bg-gray-200 rounded mb-1"></div>
              <div className="h-3 w-40 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="shadow-sm border-l-4 border-l-blue-500 bg-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            In Transit (Sending)
          </CardTitle>
          <Truck className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.inTransit}</div>
          <p className="text-xs text-muted-foreground">
            Sampel sedang dalam perjalanan ke klien
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-l-4 border-l-orange-500 bg-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            At Client (Received)
          </CardTitle>
          <PackageCheck className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.atClient}</div>
          <p className="text-xs text-muted-foreground">
            Sampel sedang dipegang oleh klien
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-l-4 border-l-green-500 bg-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            At Warehouse (Returned)
          </CardTitle>
          <Warehouse className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.atWarehouse}</div>
          <p className="text-xs text-muted-foreground">
            Sampel sudah dikembalikan ke gudang
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
