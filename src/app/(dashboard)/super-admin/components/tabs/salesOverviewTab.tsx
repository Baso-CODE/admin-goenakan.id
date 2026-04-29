// app/super-admin/components/tabs/SalesOverviewTab.tsx
"use client";

import { useState } from "react";
import SalesCategoryPieCharts from "../sales-overview/salesCategoryPieCharts";
import SalesFilter from "../sales-overview/salesFilter";
import SalesOrderStackedBar from "../sales-overview/salesOrderStackedBar";
import SalesOverviewCard from "../sales-overview/salesOverviewCard";
import SalesOverviewGraphs from "../sales-overview/salesOverviewGraphs";
import SalesTopBottomProducts from "../sales-overview/salesTopBottomProducts";

export default function SalesOverviewTab() {
  const [dateRange, setDateRange] = useState("today");
  const [comparison, setComparison] = useState("previous_period");
  const dummyMetrics = {
    revenue: "$88,978",
    orders: "88,978",
    averagePurchase: "$124.50",
    profit: "$34,500",
  };

  const handleApplyFilter = () => {
    console.log("Fetching data for:", dateRange, "compared to:", comparison);
  };
  const isComparing = comparison !== "none";
  return (
    <div className="space-y-6 animate-in fade-in duration-500 mt-6">
      {/* 1. BAGIAN FILTER */}
      <SalesFilter
        dateRange={dateRange}
        setDateRange={setDateRange}
        comparison={comparison}
        setComparison={setComparison}
        onApply={handleApplyFilter}
      />

      {/* 2. BAGIAN METRIK */}
      <SalesOverviewCard metrics={dummyMetrics} />

      {/* 3. BAGIAN GRAFIK */}
      <SalesOverviewGraphs />

      {/* 4. BAGIAN GRAFIK LINGKARAN (Kategori & Item) */}
      <SalesCategoryPieCharts hasComparison={isComparing} />

      {/* 5. BAGIAN GRAFIK STACKED BAR (Kategori Produk per Bulan) */}
      <SalesOrderStackedBar />

      {/* 6. TABEL TOP 5 & BOTTOM 5 PRODUK */}
      <SalesTopBottomProducts />
    </div>
  );
}
