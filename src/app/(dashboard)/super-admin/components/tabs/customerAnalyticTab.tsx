// app/super-admin/components/tabs/CustomerAnalyticTab.tsx
"use client";

import { useState } from "react";
import CustomerComparisonGraphs from "../customer-analytic/customerComparisonGraphs";
import CustomerFilter from "../customer-analytic/customerFilter";
import CustomerMetrics from "../customer-analytic/customerMetrics";
import CustomerRegionTable from "../customer-analytic/customerRegionTable";
import CustomerRetentionGraphs from "../customer-analytic/customerRetentionGraphs";

export default function CustomerAnalyticTab() {
  // State untuk Range Date & Comparison
  const [dateRange, setDateRange] = useState("30days");
  const [comparison, setComparison] = useState("none");

  const handleApplyFilter = () => {
    // Di sini nanti logika fetch ke backend berjalan
    console.log(
      "Fetching customer data for:",
      dateRange,
      "compared to:",
      comparison,
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 mt-6">
      {/* 1. GLOBAL FILTER (Dengan Range & Comparison) */}
      <CustomerFilter
        dateRange={dateRange}
        setDateRange={setDateRange}
        comparison={comparison}
        setComparison={setComparison}
        onApply={handleApplyFilter}
      />

      {/* 2. KEY METRICS */}
      <CustomerMetrics />

      {/* 3. ROW 1 GRAFIK: RETENTION & CHURN */}
      <CustomerRetentionGraphs />

      {/* 4. ROW 2 GRAFIK: NEW VS REPEAT COMPARISON */}
      <CustomerComparisonGraphs />

      {/* 5. TABEL DETAIL BY REGION DENGAN SORTING */}
      <CustomerRegionTable />
    </div>
  );
}
