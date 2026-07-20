"use client";

import { useApi } from "@/hooks/useApi";
import { useCallback, useEffect, useState } from "react";

import CustomerComparisonGraphs from "../customer-analytic/customerComparisonGraphs";
import CustomerFilter from "../customer-analytic/customerFilter";
import CustomerMetrics from "../customer-analytic/customerMetrics";
import CustomerRegionTable from "../customer-analytic/customerRegionTable";
import CustomerRetentionGraphs from "../customer-analytic/customerRetentionGraphs";

export default function CustomerAnalyticTab() {
  const [dateRange, setDateRange] = useState("30days");
  const [comparison, setComparison] = useState("none");

  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const [customerData, setCustomerData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Mengambil fungsi fetchApi dari custom hook milikmu
  const { fetchApi } = useApi();

  // FUNGSI UTAMA: Mengambil data dari API Backend
  const fetchCustomerAnalyticData = useCallback(async () => {
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

      // Memanggil API Backend
      const res = await fetchApi(`/analytics/customers?${params.toString()}`);
      const result = await res.json();

      if (res.ok && result.success) {
        setCustomerData(result.data);
      } else {
        throw new Error(result.message || "Failed to fetch customer data");
      }
    } catch (err) {
      console.error("❌ Error fetching customer analytics:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, customStartDate, customEndDate, fetchApi]);

  // Panggil otomatis saat pertama kali halaman dimuat
  useEffect(() => {
    fetchCustomerAnalyticData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Panggil ulang saat tombol "Apply Filter" ditekan
  const handleApplyFilter = () => {
    fetchCustomerAnalyticData();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 mt-6">
      {/* 1. GLOBAL FILTER */}
      <CustomerFilter
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
          Gagal memuat data pelanggan: {error}
        </div>
      )}

      {/* Tampilkan indikator loading atau komponen anak jika data sudah siap */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64 text-slate-500">
          Memuat data analitik pelanggan...
        </div>
      ) : (
        !error && (
          <>
            {/* 
                 PERBAIKAN DI SINI 
                Kita melakukan "Passing Props" dengan memasukkan data spesifik 
                dari API ke masing-masing komponen anak.
            */}

            {/* 2. KEY METRICS */}
            <CustomerMetrics data={customerData?.metrics} />

            {/* 3. ROW 1 GRAFIK: RETENTION & CHURN */}
            <CustomerRetentionGraphs data={customerData?.graphs?.retention} />

            {/* 4. ROW 2 GRAFIK: NEW VS REPEAT COMPARISON */}
            <CustomerComparisonGraphs data={customerData?.graphs?.comparison} />

            {/* 5. TABEL DETAIL BY REGION DENGAN SORTING */}
            <CustomerRegionTable data={customerData?.regionData} />
          </>
        )
      )}
    </div>
  );
}
