"use client";

import { useApi } from "@/hooks/useApi";
import { useCallback, useEffect, useState } from "react";
import OpsLogisticsLateDeliveries from "../customer-analytic/opsLogisticsLateDeliveries";
import OpsFilter from "../ops/opsFilter";
import OpsLogisticsAverages from "../ops/opsLogisticsAverages";
import OpsLogisticsMetrics from "../ops/opsLogisticsMetrics";
import OpsQuotationSection from "../ops/opsQuotationSection";
import OpsSampleSection from "../ops/opsSampleSection";

export default function OpsDashboardTab() {
  // State untuk Range Date & Comparison
  const [dateRange, setDateRange] = useState("30days");
  const [comparison, setComparison] = useState("none");

  // State untuk menyimpan input custom date
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const [opsData, setOpsData] = useState<any>(null);
  console.log("ini adalah data opsdata", opsData);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Mengambil fungsi fetchApi
  const { fetchApi } = useApi();

  // FUNGSI UTAMA: Mengambil data dari API Backend
  const fetchOpsAnalyticData = useCallback(async () => {
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

      const res = await fetchApi(`/analytics/operations?${params.toString()}`);
      const result = await res.json();

      if (res.ok && result.success) {
        setOpsData(result.data);
      } else {
        throw new Error(result.message || "Failed to fetch operations data");
      }
    } catch (err) {
      console.error("❌ Error fetching ops analytics:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, customStartDate, customEndDate, fetchApi]);

  // Panggil otomatis saat pertama kali halaman dimuat
  useEffect(() => {
    fetchOpsAnalyticData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Panggil ulang saat tombol "Apply Filter" ditekan
  const handleApplyFilter = () => {
    fetchOpsAnalyticData();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 mt-6 pb-10">
      {/* ✨ KOMPONEN FILTER BARU */}
      <OpsFilter
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
          Gagal memuat data operasional: {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-64 text-slate-500">
          Memuat data operasional...
        </div>
      ) : (
        !error && (
          <>
            {/* SECTION A: LOGISTICS */}
            <div className="space-y-4">
              <OpsLogisticsMetrics data={opsData?.logistics?.metrics} />

              {/* Mengirimkan data persentase performa rata-rata */}
              <OpsLogisticsAverages data={opsData?.logistics?.averages} />

              {/* Mengirimkan data grafik keterlambatan */}
              <OpsLogisticsLateDeliveries
                data={opsData?.logistics?.lateDeliveries}
              />
            </div>

            {/* SECTION B: SAMPLE */}
            <OpsSampleSection data={opsData?.sample} />

            {/* SECTION C: QUOTATION */}
            <OpsQuotationSection data={opsData?.quotation} />
          </>
        )
      )}
    </div>
  );
}
