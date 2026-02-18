"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiUrl } from "@/helper/apiurl";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

// Tipe Data Chart (Sesuai return API)
interface ChartData {
  name: string; // Jan, Feb, dst
  orders: number; // Jumlah Order
  profit: number; // Profit/Keuntungan
}

// Helper formatter untuk Tooltip Rupiah
const formatRupiahTooltip = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
};

export default function SalesCharts() {
  // === STATE ===
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  // === FETCH DATA API ===
  useEffect(() => {
    const fetchChartData = async () => {
      try {
        setLoading(true);

        // 1. Ambil Token
        const tokenRes = await fetch("/api/auth/token");
        const { token } = await tokenRes.json();

        const res = await fetch(`${apiUrl}/orders/analytics/charts`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Gagal mengambil data chart");

        const json = await res.json();

        setChartData(json.data || []);
      } catch (error) {
        console.error(error);
        toast.error("Gagal memuat statistik penjualan");
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, []);

  // === RENDER LOADING (SKELETON) ===
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 mt-4">
        {/* Skeleton Chart 1 */}
        <Card className="shadow-sm">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-75 w-full rounded-lg" />
          </CardContent>
        </Card>
        {/* Skeleton Chart 2 */}
        <Card className="shadow-sm">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-75 w-full rounded-lg" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // === RENDER CHARTS ===
  return (
    <div className="grid gap-4 md:grid-cols-2 mt-4">
      {/* CHART 1: TOTAL ORDERS (BAR CHART) */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Total Orders by Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-75 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#eee"
                />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  tickMargin={10}
                />
                <YAxis tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.05)" }}
                  formatter={(value: number) => [`${value} Orders`, "Total"]}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                  }}
                />
                <Bar
                  dataKey="orders"
                  fill="#0ea5e9" // Warna biru cerah
                  radius={[4, 4, 0, 0]}
                  name="Total Orders"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* CHART 2: PROFIT TREND (LINE CHART) */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Profit Trend by Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-75 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#eee"
                />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  tickMargin={10}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  // Formatter Y-Axis: Jika > 1 Juta, pakai 'M', jika > 1 Ribu pakai 'K'
                  tickFormatter={(value) => {
                    if (value >= 1000000) return `Rp ${value / 1000000}M`;
                    if (value >= 1000) return `Rp ${value / 1000}K`;
                    return `${value}`;
                  }}
                />
                <Tooltip
                  formatter={(value: number) => [
                    formatRupiahTooltip(value),
                    "Profit",
                  ]}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  stroke="#16a34a" // Warna hijau
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#16a34a" }}
                  activeDot={{ r: 6 }}
                  name="Profit"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
