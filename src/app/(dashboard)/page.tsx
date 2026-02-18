import { Metadata } from "next";
import SalesCharts from "./super-admin/sales/components/salesCharts";
import SalesMetrics from "./super-admin/sales/components/salesMetrics";
import TopSellingProducts from "./super-admin/sales/components/topSellingProducts";
// import { DashboardStats } from "./components/dashboardStats";
// import { RecentSales } from "./components/recentSales";
// import { RevenueChart } from "./components/revenueChart";

export const metadata: Metadata = {
  title: "Business Overview",
  description:
    "Pantau statistik pendapatan, order klien terbaru, dan status tracking pengiriman secara real-time.",
};
export default async function SuperAdminDashboard() {
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
