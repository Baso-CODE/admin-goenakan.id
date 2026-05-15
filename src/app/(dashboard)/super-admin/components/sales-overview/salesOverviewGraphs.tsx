"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

// ✨ UPDATE: Tambahkan interface untuk props data dari API
interface SalesOverviewGraphsProps {
  data?: any[]; // Menerima array grafik dari parent
}

export default function SalesOverviewGraphs({
  data = [],
}: SalesOverviewGraphsProps) {
  // Pastikan data adalah array, jika tidak berikan array kosong agar Recharts tidak error
  const chartData = Array.isArray(data) ? data : [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
      {/* 1. REVENUE TREND (BAR CHART) */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Revenue Trend
          </CardTitle>
          <CardDescription className="text-xs">
            (Berdasarkan tanggal)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-62.5 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              {/* ✨ Ganti monthlyData menjadi chartData */}
              <BarChart
                data={chartData}
                margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />
                <XAxis
                  dataKey="month" // Ini sama dengan "month" yang kita set di backend
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  // Format persingkat angka Y-Axis (contoh: 1000 jadi 1k)
                  tickFormatter={(value) =>
                    `${value >= 1000 ? value / 1000 + "k" : value}`
                  }
                />
                <Tooltip
                  cursor={{ fill: "#f1f5f9" }}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  formatter={(value: number) => [
                    `Rp ${value.toLocaleString("id-ID")}`,
                    "Revenue",
                  ]}
                />
                <Bar
                  dataKey="revenue"
                  fill="#059669"
                  radius={[4, 4, 0, 0]}
                  barSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 2. ORDER TREND (BAR CHART) */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Order Trend
          </CardTitle>
          <CardDescription className="text-xs">
            (Berdasarkan tanggal)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-62.5 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              {/* ✨ Ganti monthlyData menjadi chartData */}
              <BarChart
                data={chartData}
                margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                />
                <Tooltip
                  cursor={{ fill: "#f1f5f9" }}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  formatter={(value: number) => [
                    value.toLocaleString("id-ID"),
                    "Orders",
                  ]}
                />
                <Bar
                  dataKey="order"
                  fill="#2563eb"
                  radius={[4, 4, 0, 0]}
                  barSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 3. PROFIT TREND (LINE GRAPH) */}
      <Card className="shadow-sm border-indigo-100 bg-indigo-50/20">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-sm font-bold text-indigo-900">
                Profit Trend
              </CardTitle>
              <CardDescription className="text-xs text-indigo-600/70 mt-1">
                (Berdasarkan tanggal)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-62.5 w-full mt-1">
            <ResponsiveContainer width="100%" height="100%">
              {/* ✨ Ganti monthlyData menjadi chartData */}
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e0e7ff"
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#6366f1" }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#6366f1" }}
                  tickFormatter={(value) =>
                    `${value >= 1000 ? value / 1000 + "k" : value}`
                  }
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e0e7ff",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  formatter={(value: number) => [
                    `Rp ${value.toLocaleString("id-ID")}`,
                    "Profit",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  stroke="#4f46e5"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                    fill: "#4f46e5",
                    strokeWidth: 2,
                    stroke: "#ffffff",
                  }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
