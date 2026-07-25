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
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

//  UPDATE 1: Interface untuk props data
interface SalesOrderStackedBarProps {
  data?: any[];
}

// Warna-warni dinamis untuk tumpukan bar (jika kategori lebih dari 4, akan otomatis memutar warnanya)
const STACK_COLORS = [
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#6366f1",
  "#ec4899",
  "#8b5cf6",
];

export default function SalesOrderStackedBar({
  data = [],
}: SalesOrderStackedBarProps) {
  const chartData = Array.isArray(data) ? data : [];

  //  UPDATE 2: Mengambil nama-nama kategori secara dinamis dari data API
  // Kita menyingkirkan key standar (month, revenue, order, profit) agar yang tersisa hanyalah nama kategori produk
  const categoryKeys = Array.from(
    new Set(
      chartData.flatMap((item) =>
        Object.keys(item).filter(
          (key) => !["month", "revenue", "order", "profit"].includes(key),
        ),
      ),
    ),
  );

  return (
    <Card className="shadow-sm mt-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-slate-800">
          Revenue by Product Category
        </CardTitle>
        <CardDescription className="text-xs">
          (Berdasarkan tanggal filter) - Stacked Bar Chart
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-87.5 w-full mt-4">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: -10, bottom: 5 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />
                <XAxis
                  dataKey="month" // Diambil dari API
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#64748b" }}
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
                  formatter={(value: number, name: string) => [
                    new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      minimumFractionDigits: 0,
                    }).format(value),
                    name,
                  ]}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ paddingTop: "20px" }}
                />

                {/*  UPDATE 3: Render Bar secara dinamis berdasarkan kategori yang ditemukan */}
                {categoryKeys.map((categoryName, index) => (
                  <Bar
                    key={categoryName}
                    dataKey={categoryName}
                    name={categoryName}
                    stackId="a"
                    fill={STACK_COLORS[index % STACK_COLORS.length]}
                    maxBarSize={50}
                    // Radius atas hanya diberikan (opsional) namun karena ditumpuk, lebih baik kotak
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              Tidak ada data pesanan
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
