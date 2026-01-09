import { DashboardStats } from "./components/dashboardStats";
import { RecentSales } from "./components/recentSales";
import { RevenueChart } from "./components/revenueChart"; // Pastikan path benar

export default async function SuperAdminDashboard() {
  return (
    <div className="space-y-6 p-8 pt-6">
      {/* Judul & Header */}
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>

      {/* BAGIAN 1: Summary Cards (4 Kolom) */}
      <DashboardStats />

      {/* BAGIAN 2: Grafik & List (Grid Layout) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Chart mengambil 4 kolom (Lebih Lebar) */}
        <div className="col-span-4">
          <RevenueChart />
        </div>

        {/* Recent Sales mengambil 3 kolom (Sidebar Kanan) */}
        <div className="col-span-3">
          <RecentSales />
        </div>
      </div>
    </div>
  );
}
