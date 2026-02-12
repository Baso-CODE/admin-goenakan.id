import SalesCharts from "./components/salesCharts";
import SalesMetrics from "./components/salesMetrics";
import TopSellingProducts from "./components/topSellingProducts";

export default function SalesPage() {
  return (
    <div className="w-full mx-auto space-y-6">
      {/* HEADER HALAMAN */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Sales Overview</h1>
        <p className="text-muted-foreground">
          Pantau performa penjualan, pendapatan, dan tren keuntungan perusahaan.
        </p>
      </div>

      {/* BAGIAN 1: METRICS BOXES */}
      <SalesMetrics />

      {/* BAGIAN 2: CHARTS */}
      <SalesCharts />

      {/* BAGIAN 3: TOP SELLING PRODUCT */}
      <TopSellingProducts />
    </div>
  );
}
