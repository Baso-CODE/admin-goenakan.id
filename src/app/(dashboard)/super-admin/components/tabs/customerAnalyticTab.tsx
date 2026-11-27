"use client";

import { UsersRound } from "lucide-react";
import type { ComponentProps } from "react";

import CustomerChannelOrderChart from "../customer-analytic/customerChannelOrderChart";
import CustomerComparisonGraphs from "../customer-analytic/customerComparisonGraphs";
import CustomerMetrics from "../customer-analytic/customerMetrics";
import CustomerRegionTable from "../customer-analytic/customerRegionTable";
import CustomerRetentionGraphs from "../customer-analytic/customerRetentionGraphs";

import {
  AnalyticsPeriodFilter,
  useAnalyticsPeriod,
  type AnalyticsPeriodData,
} from "../shared/analyticsPeriodFilter";

interface CustomerAnalyticsData extends AnalyticsPeriodData {
  metrics: NonNullable<ComponentProps<typeof CustomerMetrics>["data"]> & {
    totalUniqueCustomer: number;
  };

  graphs: {
    retention: ComponentProps<typeof CustomerRetentionGraphs>["data"];

    comparison: ComponentProps<typeof CustomerComparisonGraphs>["data"];

    channelOrders: ComponentProps<typeof CustomerChannelOrderChart>["data"];
  };

  regionData: ComponentProps<typeof CustomerRegionTable>["data"];
}

export default function CustomerAnalyticTab() {
  const analytics = useAnalyticsPeriod<CustomerAnalyticsData>(
    "/analytics/customers",
  );

  const { data } = analytics;

  return (
    <div className="mt-6 min-w-0 space-y-6 pb-10 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <div className="rounded-xl border bg-blue-50 p-3 dark:bg-blue-950/40">
          <UsersRound className="h-6 w-6 text-blue-600" />
        </div>

        <div>
          <h2 className="text-xl font-bold tracking-tight">
            Customer Analytics
          </h2>

          <p className="text-sm text-muted-foreground">
            Pantau pertumbuhan, retensi, dan distribusi pelanggan perusahaan.
          </p>
        </div>
      </div>

      {/* FILTER & CONTENT */}
      <AnalyticsPeriodFilter
        state={analytics}
        description="Filter aktivitas pelanggan berdasarkan periode."
        emptyMessage={
          data?.metrics.totalUniqueCustomer === 0
            ? "Tidak ada pelanggan dengan transaksi yang memenuhi kriteria pada periode ini. Coba gunakan Last 90 Days atau Last 1 Year."
            : null
        }>
        {data && (
          <div className="min-w-0 space-y-6">
            {/* CUSTOMER METRICS */}
            <CustomerMetrics data={data.metrics} />

            {/* RETENTION */}
            <CustomerRetentionGraphs data={data.graphs.retention} />

            {/* NEW VS RETURNING */}
            <CustomerComparisonGraphs data={data.graphs.comparison} />

            {/* ORDER BY CHANNEL */}
            <CustomerChannelOrderChart data={data.graphs.channelOrders} />

            {/* CUSTOMER REGION */}
            <CustomerRegionTable data={data.regionData} />
          </div>
        )}
      </AnalyticsPeriodFilter>
    </div>
  );
}
