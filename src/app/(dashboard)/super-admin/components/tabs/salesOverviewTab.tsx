"use client";

import { ChartNoAxesCombined } from "lucide-react";
import type { ComponentProps } from "react";

import SalesCategoryPieCharts from "../sales-overview/salesCategoryPieCharts";
import SalesOrderStackedBar from "../sales-overview/salesOrderStackedBar";
import SalesOverviewCard from "../sales-overview/salesOverviewCard";
import SalesOverviewGraphs from "../sales-overview/salesOverviewGraphs";
import SalesTopBottomProducts from "../sales-overview/salesTopBottomProducts";

import {
  AnalyticsPeriodFilter,
  useAnalyticsPeriod,
  type AnalyticsPeriodData,
} from "../shared/analyticsPeriodFilter";

interface SalesTrendItem {
  label: string;
  revenue: number;
  order: number;
  profit: number;
  categories: Record<string, number>;
}

interface SalesOverviewData extends AnalyticsPeriodData {
  metrics: NonNullable<ComponentProps<typeof SalesOverviewCard>["metrics"]>;

  graphs: {
    trend: SalesTrendItem[];
  };

  pieCharts: ComponentProps<typeof SalesCategoryPieCharts>["data"];

  productsPerformance: ComponentProps<typeof SalesTopBottomProducts>["data"];
}

export default function SalesOverviewTab() {
  const analytics = useAnalyticsPeriod<SalesOverviewData>(
    "/analytics/sales-overview",
  );

  const { data } = analytics;

  // ========================================
  // NORMALIZE CHART DATA
  // ========================================
  // Backend mengirim label dan nested categories.
  // Komponen chart existing menggunakan month
  // dan kategori sebagai flat keys.
  const trendData = (data?.graphs?.trend || []).map((item) => ({
    month: item.label,
    revenue: item.revenue,
    order: item.order,
    profit: item.profit,
  }));

  const stackedBarData = (data?.graphs?.trend || []).map((item) => ({
    ...item.categories,
    month: item.label,
    revenue: item.revenue,
    order: item.order,
    profit: item.profit,
  }));

  return (
    <div className="mt-6 min-w-0 space-y-6 pb-10 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <div className="rounded-xl border bg-blue-50 p-3 dark:bg-blue-950/40">
          <ChartNoAxesCombined className="h-6 w-6 text-blue-600" />
        </div>

        <div>
          <h2 className="text-xl font-bold tracking-tight">Sales Overview</h2>

          <p className="text-sm text-muted-foreground">
            Pantau pendapatan, transaksi, dan performa produk perusahaan.
          </p>
        </div>
      </div>

      {/* FILTER & CONTENT */}
      <AnalyticsPeriodFilter
        state={analytics}
        description="Filter pendapatan dan transaksi berdasarkan periode."
        emptyMessage={
          data?.metrics.orders === 0
            ? "Tidak ada transaksi yang memenuhi kriteria pada periode ini. Coba gunakan rentang waktu yang lebih panjang."
            : null
        }>
        {data && (
          <div className="min-w-0 space-y-6">
            {/* METRICS */}
            <SalesOverviewCard metrics={data.metrics} />

            {/* SALES TREND */}
            <SalesOverviewGraphs data={trendData} />

            {/* PRODUCT CATEGORY */}
            <SalesCategoryPieCharts
              hasComparison={false}
              data={data.pieCharts}
            />

            {/* STACKED BAR */}
            <SalesOrderStackedBar data={stackedBarData} />

            {/* PRODUCT PERFORMANCE */}
            <SalesTopBottomProducts data={data.productsPerformance} />
          </div>
        )}
      </AnalyticsPeriodFilter>
    </div>
  );
}
