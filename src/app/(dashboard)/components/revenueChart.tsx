"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useApi } from "@/hooks/useApi";
import { Loader2 } from "lucide-react";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

// Helper Format Rupiah
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Konfigurasi Warna & Label Chart
const chartConfig = {
  revenue: {
    label: "Pendapatan",
    color: "#2563eb",
  },
} satisfies ChartConfig;

export function RevenueChart() {
  const { fetchApi, status } = useApi();
  const [chartData, setChartData] = useState<
    { date: string; revenue: number }[]
  >([]);
  const [loading, setLoading] = useState(true);

  // === FETCH DATA DARI API ===
  useEffect(() => {
    const fetchData = async () => {
      if (status !== "authenticated") return;

      try {
        setLoading(true);
        const date = new Date();
        const month = date.getMonth() + 1;
        const year = date.getFullYear();

        const res = await fetchApi(
          `/invoices/chart?month=${month}&year=${year}`,
        );

        if (!res.ok) throw new Error("Gagal mengambil data chart");

        const data = await res.json();
        setChartData(data);
      } catch (error) {
        console.error("❌ Gagal ambil data chart:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [status, fetchApi]);

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Overview Pendapatan Bulanan</CardTitle>
        <CardDescription>
          Total pemasukan dari invoice lunas (Paid) bulan ini.
        </CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        {loading ? (
          <div className="h-87.5 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-87.5 w-full">
            <BarChart accessibilityLayer data={chartData}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />

              <XAxis
                dataKey="date"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value.slice(0, 6)}
              />

              {/* Tooltip Custom Shadcn */}
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                }
              />

              <Bar
                dataKey="revenue"
                fill="var(--color-revenue)"
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
