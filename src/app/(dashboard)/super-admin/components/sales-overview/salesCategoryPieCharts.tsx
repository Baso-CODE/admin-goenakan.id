"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

// === DUMMY DATA ===
const dataCategory = [
  { name: "Drinkware", value: 45000 },
  { name: "Stationary", value: 30000 },
  { name: "Apparel", value: 15000 },
  { name: "Accessories", value: 10000 },
];

const dataItemStationary = [
  { name: "Pensil", value: 12000 },
  { name: "Penggaris", value: 8000 },
  { name: "Spidol", value: 6000 },
  { name: "Buku Tulis", value: 4000 },
];

const dataItemDrinkware = [
  { name: "Tumbler Stainless", value: 25000 },
  { name: "Mug Keramik", value: 15000 },
  { name: "Botol Plastik", value: 5000 },
];

// Palet warna yang elegan untuk Pie Chart
const COLORS = ["#0ea5e9", "#10b981", "#f59e0b", "#6366f1", "#ec4899"];

interface SalesCategoryPieChartsProps {
  hasComparison?: boolean; // Prop untuk mengecek apakah user sedang membandingkan tanggal
}

export default function SalesCategoryPieCharts({
  hasComparison = false,
}: SalesCategoryPieChartsProps) {
  const [selectedCategory, setSelectedCategory] = useState("stationary");

  // Logika sederhana untuk mengganti data grafik kanan berdasarkan dropdown
  const currentItemData =
    selectedCategory === "stationary" ? dataItemStationary : dataItemDrinkware;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
      {/* 1. GRAFIK KIRI: REVENUE BY PRODUCT CATEGORY */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Revenue by Product Category
          </CardTitle>
          <CardDescription className="text-xs">
            (Default is total revenue from beginning until now)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-75 w-full mt-4">
            {hasComparison ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground bg-slate-50 border border-dashed rounded-md">
                <p>
                  Fitur Comparison: Menampilkan 2 Pie Chart (Current vs
                  Previous)
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataCategory}
                    cx="50%"
                    cy="45%"
                    innerRadius={60} // Hapus baris ini jika ingin Pie penuh tanpa lubang di tengah
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    labelLine={false}
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>
                    {dataCategory.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [
                      `$${value.toLocaleString()}`,
                      "Revenue",
                    ]}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 2. GRAFIK KANAN: REVENUE BY ITEM CATEGORY */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-semibold text-slate-800">
                Revenue by Item Category
              </CardTitle>
              <CardDescription className="text-xs mt-1 max-w-62.5">
                Filter per kategori produk. <br /> (Default: All)
              </CardDescription>
            </div>
            {/* DROPDOWN FILTER KHUSUS GRAFIK KANAN */}
            <div className="w-35 shrink-0">
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Pilih Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stationary">Stationary</SelectItem>
                  <SelectItem value="drinkware">Drinkware</SelectItem>
                  <SelectItem value="all" disabled>
                    All (Coming Soon)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-75 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={currentItemData}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  labelLine={false}
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>
                  {currentItemData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[(index + 2) % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [
                    `$${value.toLocaleString()}`,
                    "Revenue",
                  ]}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
