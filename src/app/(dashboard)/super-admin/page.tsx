import SalesPerformanceDashboard from "../components/salesPerformanceDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import CustomerAnalyticTab from "./components/tabs/customerAnalyticTab";
import OpsDashboardTab from "./components/tabs/opsDashboardTab";
import QuotationAnalyticTab from "./components/tabs/quotationAnalyticTab";
import SalesOverviewTab from "./components/tabs/salesOverviewTab";
import SummaryTab from "./components/tabs/summaryTab";

export const metadata = {
  title: "Dashboard - Super Admin",
  description: "Overview penjualan dan performa bisnis.",
};

export default function SuperAdminPage() {
  return (
    <div className="w-full mx-auto space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Main Dashboard</h1>

        <p className="text-muted-foreground">
          Pantau performa penjualan, pendapatan, operasional, tren pelanggan,
          dan konversi penawaran perusahaan.
        </p>
      </div>

      {/* DASHBOARD TABS */}
      <Tabs defaultValue="summary" className="w-full">
        <div className="overflow-x-auto pb-2">
          <TabsList className="inline-flex w-max min-w-full bg-muted/50 sm:min-w-0">
            <TabsTrigger value="summary">Summary</TabsTrigger>

            <TabsTrigger value="sales-detail">Sales Overview</TabsTrigger>

            <TabsTrigger value="customers">Customer Analytic</TabsTrigger>

            <TabsTrigger value="operations">Ops Dashboard</TabsTrigger>

            <TabsTrigger value="quotation">Quotation</TabsTrigger>
            <TabsTrigger value="sales-performance">Sales Performance</TabsTrigger>
          </TabsList>
        </div>

        {/* TAB 1: SUMMARY */}
        <TabsContent value="summary" className="outline-none">
          <SummaryTab />
        </TabsContent>

        {/* TAB 2: SALES OVERVIEW */}
        <TabsContent value="sales-detail" className="outline-none">
          <SalesOverviewTab />
        </TabsContent>

        {/* TAB 3: CUSTOMER ANALYTICS */}
        <TabsContent value="customers" className="outline-none">
          <CustomerAnalyticTab />
        </TabsContent>

        {/* TAB 4: OPERATIONS */}
        <TabsContent value="operations" className="outline-none">
          <OpsDashboardTab />
        </TabsContent>

        {/* TAB 5: QUOTATION ANALYTICS */}
        <TabsContent value="quotation" className="outline-none">
          <QuotationAnalyticTab />
        </TabsContent>
        <TabsContent value="sales-performance" className="outline-none">
          <SalesPerformanceDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
