import SalesCharts from "../../sales/components/salesCharts";
import SalesMetrics from "../../sales/components/salesMetrics";
import TopSellingProducts from "../../sales/components/topSellingProducts";

export default function SummaryTab() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 mt-6">
      {/* BAGIAN 1: METRICS BOXES */}
      <SalesMetrics />

      {/* BAGIAN 2: CHARTS */}
      <SalesCharts />

      {/* BAGIAN 3: TOP SELLING PRODUCT */}
      <TopSellingProducts />
    </div>
  );
}
