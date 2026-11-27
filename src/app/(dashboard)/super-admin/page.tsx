import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  ChartNoAxesCombined,
  FileText,
  LayoutDashboard,
  PackageCheck,
  TrendingUp,
  Truck,
  UsersRound,
} from "lucide-react";

import SalesPerformanceDashboard from "../components/salesPerformanceDashboard";

import CustomerAnalyticTab from "./components/tabs/customerAnalyticTab";
import OpsDashboardTab from "./components/tabs/opsDashboardTab";
import QuotationAnalyticTab from "./components/tabs/quotationAnalyticTab";
import SalesOverviewTab from "./components/tabs/salesOverviewTab";
import SampleAnalyticTab from "./components/tabs/sampleAnalyticTab";
import SummaryTab from "./components/tabs/summaryTab";

export const metadata = {
  title: "Dashboard - Super Admin",
  description: "Overview penjualan dan performa bisnis.",
};

// ==========================================
// DASHBOARD TAB CONFIGURATION
// ==========================================
const dashboardTabs = [
  {
    value: "summary",
    label: "Summary",
    icon: LayoutDashboard,
  },
  {
    value: "sales-detail",
    label: "Sales Overview",
    icon: ChartNoAxesCombined,
  },
  {
    value: "customers",
    label: "Customer Analytics",
    icon: UsersRound,
  },
  {
    value: "operations",
    label: "Operations",
    icon: Truck,
  },
  {
    value: "quotation",
    label: "Quotation",
    icon: FileText,
  },
  {
    value: "samples",
    label: "Sample Analytics",
    icon: PackageCheck,
  },
  {
    value: "sales-performance",
    label: "Sales Performance",
    icon: TrendingUp,
  },
];

const tabContentClass = "mt-3 sm:mt-4 w-full min-w-0 max-w-full outline-none";

export default function SuperAdminPage() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-full space-y-5 pb-8 sm:space-y-7">
      {/* ======================================
          PAGE HEADER
      ======================================= */}
      <div className="flex min-w-0 flex-col gap-2">
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl lg:text-3xl">
          Main Dashboard
        </h1>

        <p className="max-w-4xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
          Pantau performa penjualan, pendapatan, operasional, tren pelanggan,
          sample, dan konversi penawaran perusahaan.
        </p>
      </div>

      {/* ======================================
          DASHBOARD NAVIGATION
      ======================================= */}
      <Tabs defaultValue="summary" className="w-full min-w-0 max-w-full gap-0">
        {/* RESPONSIVE GRID CONTAINER */}
        <div className="w-full min-w-0 max-w-full border-b border-border pb-3">
          <TabsList
            aria-label="Dashboard navigation"
            className="
              grid
              h-auto
              w-full
              min-w-0
              max-w-full
              grid-cols-[repeat(auto-fit,minmax(min(100%,125px),1fr))]
              items-stretch
              gap-1.5
              rounded-none
              bg-transparent
              p-0
              sm:gap-2
            ">
            {dashboardTabs.map((tab) => {
              const Icon = tab.icon;

              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="
                    group
                    relative
                    flex
                    h-full
                    min-h-[68px]
                    w-full
                    min-w-0
                    flex-col
                    items-center
                    justify-center
                    gap-1.5
                    cursor-pointer
                    rounded-lg
                    border
                    border-transparent
                    bg-muted/20
                    px-2
                    py-3
                    text-center
                    text-[11px]
                    font-medium
                    leading-snug
                    whitespace-normal
                    text-muted-foreground
                    shadow-none
                    transition-all
                    duration-200

                    hover:bg-muted/60
                    hover:text-foreground

                    focus-visible:ring-2
                    focus-visible:ring-primary/40
                    focus-visible:ring-inset

                    data-[state=active]:border-[#A97A61]/30
                    data-[state=active]:bg-[#A97A61]/10
                    data-[state=active]:font-semibold
                    data-[state=active]:text-[#76513F]
                    data-[state=active]:shadow-none

                    dark:data-[state=active]:bg-[#A97A61]/15
                    dark:data-[state=active]:text-[#D5B39E]

                    sm:min-h-[78px]
                    sm:gap-2
                    sm:px-3
                    sm:text-xs
                    lg:text-[13px]
                  ">
                  {/* TAB ICON */}
                  <Icon
                    strokeWidth={1.8}
                    className="
                      size-[18px]
                      shrink-0
                      transition-colors
                      duration-200
                      group-data-[state=active]:text-[#A97A61]
                      sm:size-5
                    "
                  />

                  {/* TAB LABEL */}
                  <span className="min-w-0 max-w-full break-words whitespace-normal">
                    {tab.label}
                  </span>

                  {/* ACTIVE INDICATOR */}
                  <span
                    aria-hidden="true"
                    className="
                      absolute
                      inset-x-3
                      bottom-0
                      h-[3px]
                      origin-center
                      scale-x-0
                      rounded-full
                      bg-[#A97A61]
                      opacity-0
                      transition-all
                      duration-200
                      group-data-[state=active]:scale-x-100
                      group-data-[state=active]:opacity-100
                      sm:inset-x-4
                    "
                  />
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {/* ======================================
            DASHBOARD CONTENT
        ======================================= */}

        {/* SUMMARY */}
        <TabsContent value="summary" className={tabContentClass}>
          <SummaryTab />
        </TabsContent>

        {/* SALES OVERVIEW */}
        <TabsContent value="sales-detail" className={tabContentClass}>
          <SalesOverviewTab />
        </TabsContent>

        {/* CUSTOMER ANALYTICS */}
        <TabsContent value="customers" className={tabContentClass}>
          <CustomerAnalyticTab />
        </TabsContent>

        {/* OPERATIONS DASHBOARD */}
        <TabsContent value="operations" className={tabContentClass}>
          <OpsDashboardTab />
        </TabsContent>

        {/* QUOTATION ANALYTICS */}
        <TabsContent value="quotation" className={tabContentClass}>
          <QuotationAnalyticTab />
        </TabsContent>

        {/* SAMPLE ANALYTICS */}
        <TabsContent value="samples" className={tabContentClass}>
          <SampleAnalyticTab />
        </TabsContent>

        {/* SALES PERFORMANCE */}
        <TabsContent value="sales-performance" className={tabContentClass}>
          <SalesPerformanceDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
