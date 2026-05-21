"use client";

import { useApi } from "@/hooks/useApi";
import { useCallback, useEffect, useState } from "react";

import SalesCategoryPieCharts from "../sales-overview/salesCategoryPieCharts";
import SalesFilter from "../sales-overview/salesFilter";
import SalesOrderStackedBar from "../sales-overview/salesOrderStackedBar";
import SalesOverviewCard from "../sales-overview/salesOverviewCard";
import SalesOverviewGraphs from "../sales-overview/salesOverviewGraphs";
import SalesTopBottomProducts from "../sales-overview/salesTopBottomProducts";

export default function SalesOverviewTab() {
  const [dateRange, setDateRange] = useState("today");
  const [comparison, setComparison] = useState("previous_period");

  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const [dashboardData, setDashboardData] = useState<any>(null);

  console.log("ini adalah data", dashboardData);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null); // ✨ Tambahan state untuk error

  // ✨ Mengambil fetchApi dari custom hook milikmu
  const { fetchApi } = useApi();

  // Data dummy sebagai fallback
  const dummyMetrics = {
    revenue: "$0",
    orders: "0",
    averagePurchase: "$0",
    profit: "$0",
  };

  // ✨ Menggunakan useCallback dan fetchApi persis seperti pola kodemu
  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        range: dateRange,
      });

      if (dateRange === "custom") {
        if (customStartDate) params.append("startDate", customStartDate);
        if (customEndDate) params.append("endDate", customEndDate);
      }

      // ✨ Menggunakan fetchApi (URL tidak perlu http://localhost lagi jika sudah diatur di useApi)
      const res = await fetchApi(
        `/analytics/sales-overview?${params.toString()}`,
      );
      const result = await res.json();

      if (res.ok && result.success) {
        setDashboardData(result.data);
      } else {
        throw new Error(result.message || "Failed to fetch dashboard data");
      }
    } catch (err) {
      console.error("❌ Error fetching dashboard:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, customStartDate, customEndDate, fetchApi]);

  // Panggil saat pertama kali halaman dimuat
  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Catatan: Array dependencies sengaja dikosongkan agar tidak otomatis fetch
  // saat user baru mengetik tanggal. Kita mengandalkan tombol "Apply".

  // Panggil saat tombol Apply diklik
  const handleApplyFilter = () => {
    fetchDashboardData();
  };

  const isComparing = comparison !== "none";

  return (
    <div className="space-y-6 animate-in fade-in duration-500 mt-6">
      <SalesFilter
        dateRange={dateRange}
        setDateRange={setDateRange}
        customStartDate={customStartDate}
        setCustomStartDate={setCustomStartDate}
        customEndDate={customEndDate}
        setCustomEndDate={setCustomEndDate}
        comparison={comparison}
        setComparison={setComparison}
        onApply={handleApplyFilter}
      />

      {/* Menampilkan pesan error jika API gagal */}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md text-sm text-center">
          Gagal memuat data: {error}
        </div>
      )}

      {/* Tampilkan indikator loading */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64 text-slate-500">
          Memuat data analitik...
        </div>
      ) : (
        !error && (
          <>
            {/* 2. BAGIAN METRIK */}
            <SalesOverviewCard
              metrics={dashboardData ? dashboardData.metrics : dummyMetrics}
            />

            {/* 3. BAGIAN GRAFIK */}
            <SalesOverviewGraphs data={dashboardData?.graphs?.trend} />

            {/* 4. BAGIAN GRAFIK LINGKARAN */}
            <SalesCategoryPieCharts
              hasComparison={isComparing}
              data={dashboardData?.pieCharts}
            />

            {/* 5. BAGIAN GRAFIK STACKED BAR */}
            <SalesOrderStackedBar data={dashboardData?.graphs?.trend} />

            {/* 6. TABEL TOP 5 & BOTTOM 5 PRODUK */}
            <SalesTopBottomProducts data={dashboardData?.productsPerformance} />
          </>
        )
      )}
    </div>
  );
}
