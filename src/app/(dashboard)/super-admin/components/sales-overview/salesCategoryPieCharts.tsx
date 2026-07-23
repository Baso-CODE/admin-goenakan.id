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

const COLORS = [
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#6366f1",
  "#ec4899",
  "#8b5cf6",
  "#f43f5e",
];

interface PieData {
  name: string;
  value: number;
}

interface SalesCategoryPieChartsProps {
  hasComparison?: boolean;
  data?: {
    productCategories: PieData[];
    itemCategories: Record<string, PieData[]>; //  Diperbarui: Menerima tipe Object Record
  };
}

export default function SalesCategoryPieCharts({
  hasComparison = false,
  data,
}: SalesCategoryPieChartsProps) {
  //  STATE BARU: Mengatur kategori apa yang dipilih di grafik kanan (Default: "all")
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const productCategories = data?.productCategories || [];

  //  LOGIKA BARU: Mengambil seluruh objek itemCategories, dan daftar nama kategorinya
  const itemCategoriesObject = data?.itemCategories || { all: [] };

  // Daftar pilihan untuk Dropdown (contoh: ["all", "Drinkware", "Stationary", "Uncategorized"])
  const dropdownOptions = Object.keys(itemCategoriesObject);

  // Data item yang akan dirender berdasarkan Dropdown yang dipilih
  const currentItemData = itemCategoriesObject[selectedCategory] || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
      {/* ============================================================== */}
      {/* 1. GRAFIK KIRI: REVENUE BY PRODUCT CATEGORY                      */}
      {/* ============================================================== */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Revenue by Product Category
          </CardTitle>
          <CardDescription className="text-xs">
            (Berdasarkan rentang waktu filter)
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
            ) : productCategories.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={productCategories}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    labelLine={false}
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>
                    {productCategories.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [
                      new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 0,
                      }).format(value),
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
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                Tidak ada data
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ============================================================== */}
      {/* 2. GRAFIK KANAN: REVENUE BY ITEM CATEGORY                        */}
      {/* ============================================================== */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-semibold text-slate-800">
                Revenue by Item Category
              </CardTitle>
              <CardDescription className="text-xs mt-1 max-w-62.5">
                Menampilkan sub-kategori berdasarkan produk
              </CardDescription>
            </div>
            {/*  DROPDOWN DINAMIS BERDASARKAN API */}
            <div className="w-35 shrink-0">
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Pilih Kategori" />
                </SelectTrigger>
                <SelectContent>
                  {dropdownOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option === "all" ? "All Categories" : option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-75 w-full mt-2">
            {currentItemData.length > 0 ? (
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
                      new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 0,
                      }).format(value),
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
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                Tidak ada data item untuk kategori ini
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
