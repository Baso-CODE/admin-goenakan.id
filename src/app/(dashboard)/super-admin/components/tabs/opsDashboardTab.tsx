"use client";

import { Truck } from "lucide-react";
import type { ComponentProps } from "react";

import OpsLogisticsLateDeliveries from "../customer-analytic/opsLogisticsLateDeliveries";
import OpsLogisticsAverages from "../ops/opsLogisticsAverages";
import OpsLogisticsMetrics from "../ops/opsLogisticsMetrics";

import {
  AnalyticsPeriodFilter,
  useAnalyticsPeriod,
  type AnalyticsPeriodData,
} from "../shared/analyticsPeriodFilter";

interface OpsAnalyticsData extends AnalyticsPeriodData {
  logistics: {
    metrics: NonNullable<ComponentProps<typeof OpsLogisticsMetrics>["data"]>;

    averages: ComponentProps<typeof OpsLogisticsAverages>["data"];

    lateDeliveries: ComponentProps<typeof OpsLogisticsLateDeliveries>["data"];
  };
}

export default function OpsDashboardTab() {
  const analytics = useAnalyticsPeriod<OpsAnalyticsData>(
    "/analytics/operations",
  );

  const { data } = analytics;

  const metrics = data?.logistics.metrics;

  const hasPipelineActivity = metrics
    ? [
        metrics.production,
        metrics.packaging,
        metrics.shipping,
        metrics.sendToCustomer,
        metrics.complete,
      ].some((value) => value > 0)
    : false;

  return (
    <div className="mt-6 min-w-0 space-y-6 pb-10 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <div className="rounded-xl border bg-blue-50 p-3 dark:bg-blue-950/40">
          <Truck className="h-6 w-6 text-blue-600" />
        </div>

        <div>
          <h2 className="text-xl font-bold tracking-tight">
            Operations Dashboard
          </h2>

          <p className="text-sm text-muted-foreground">
            Monitor produksi, pengiriman, fulfillment, dan performa logistik.
          </p>
        </div>
      </div>

      {/* FILTER & CONTENT */}
      <AnalyticsPeriodFilter
        state={analytics}
        description="Filter produksi, pengiriman, dan performa logistik berdasarkan periode."
        emptyMessage={
          metrics && !hasPipelineActivity
            ? "Seluruh Logistics Pipeline menunjukkan angka 0 pada periode ini. Periksa rentang tanggal atau gunakan periode yang lebih panjang."
            : null
        }>
        {data && (
          <div className="min-w-0 space-y-6">
            {/* LOGISTICS METRICS */}
            <OpsLogisticsMetrics data={data.logistics.metrics} />

            {/* LOGISTICS AVERAGES */}
            <OpsLogisticsAverages data={data.logistics.averages} />

            {/* LATE DELIVERIES */}
            <OpsLogisticsLateDeliveries data={data.logistics.lateDeliveries} />
          </div>
        )}
      </AnalyticsPeriodFilter>
    </div>
  );
}
