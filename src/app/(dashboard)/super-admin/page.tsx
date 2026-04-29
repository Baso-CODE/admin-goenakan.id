import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CustomerAnalyticTab from "./components/tabs/customerAnalyticTab";
import OpsDashboardTab from "./components/tabs/opsDashboardTab";
import SalesOverviewTab from "./components/tabs/salesOverviewTab";
import SummaryTab from "./components/tabs/summaryTab";

// Metadata
export const metadata = {
  title: "Dashboard - Super Admin",
  description: "Overview penjualan dan performa bisnis.",
};

export default function SuperAdminPage() {
  return (
    <div className="w-full mx-auto space-y-6">
      {/* HEADER HALAMAN (Tetap Muncul di Semua Tab) */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Main Dashboard</h1>
        <p className="text-muted-foreground">
          Pantau performa penjualan, pendapatan, operasional, dan tren pelanggan
          perusahaan.
        </p>
      </div>

      {/* TABS CONTAINER */}
      <Tabs defaultValue="summary" className="w-full">
        {/* NAVIGASI 4 TABS */}
        <div className="overflow-x-auto pb-2">
          <TabsList className="inline-flex w-full sm:w-auto bg-slate-100/50">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="sales-detail">Sales Overview</TabsTrigger>
            <TabsTrigger value="customers">Customer Analytic</TabsTrigger>
            <TabsTrigger value="operations">Ops Dashboard</TabsTrigger>
          </TabsList>
        </div>

        {/* KONTEN TAB 1: SUMMARY (Versi Singkat yang sekarang ada) */}
        <TabsContent value="summary" className="outline-none">
          <SummaryTab />
        </TabsContent>

        {/* KONTEN TAB 2: SALES OVERVIEW (Versi Panjang/Detail) */}
        <TabsContent value="sales-detail" className="outline-none">
          <SalesOverviewTab />
        </TabsContent>

        {/* KONTEN TAB 3: CUSTOMER ANALYTICS */}
        <TabsContent value="customers" className="outline-none">
          <CustomerAnalyticTab />
        </TabsContent>

        {/* KONTEN TAB 4: OPERATIONS */}
        <TabsContent value="operations" className="outline-none">
          <OpsDashboardTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
