"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

// DUMMY DATA TRANSAKSI 12 BULAN
const chartData = [
  { name: "Jan", orders: 65, profit: 15000000 },
  { name: "Feb", orders: 59, profit: 12000000 },
  { name: "Mar", orders: 80, profit: 25000000 },
  { name: "Apr", orders: 81, profit: 27000000 },
  { name: "Mei", orders: 56, profit: 18000000 },
  { name: "Jun", orders: 55, profit: 17000000 },
  { name: "Jul", orders: 40, profit: 10000000 },
  { name: "Ags", orders: 90, profit: 32000000 },
  { name: "Sep", orders: 110, profit: 45000000 },
  { name: "Okt", orders: 130, profit: 55000000 },
  { name: "Nov", orders: 140, profit: 60000000 },
  { name: "Des", orders: 170, profit: 85000000 },
];

// Helper formatter untuk Tooltip Rupiah
const formatRupiahTooltip = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
};

export default function SalesCharts() {
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
                  tickFormatter={(value) => `Rp ${value / 1000000}M`} // Tampilkan dalam format M (Juta) agar tidak kepanjangan
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
