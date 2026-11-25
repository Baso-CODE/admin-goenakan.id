"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Factory, Info, Ship, Truck } from "lucide-react";

export interface LogisticsAveragesData {
  avgProductionDays?: number | null;
  avgShippingDays?: number | null;
  avgFulfillmentDays?: number | null;

  avgProductionImportDays: number | null;
  avgShippingImportDays: number | null;

  avgProductionDomesticDays: number | null;
  avgShippingDomesticDays: number | null;

  productionImportCount: number;
  shippingImportCount: number;

  productionDomesticCount: number;
  shippingDomesticCount: number;

  unclassifiedProductionCount: number;
  unclassifiedShippingCount: number;
}

interface OpsLogisticsAveragesProps {
  data?: LogisticsAveragesData;
}

export default function OpsLogisticsAverages({
  data,
}: OpsLogisticsAveragesProps) {
  // ==========================================
  // METRIC CONFIGURATION
  // ==========================================
  const metrics = [
    {
      id: "production-import",

      title: "Average Production Time (Import)",

      category: "Import",

      value: data?.avgProductionImportDays ?? null,

      count: data?.productionImportCount ?? 0,

      unit: "production records",

      description: "Rata-rata waktu produksi vendor luar negeri.",

      icon: Factory,

      iconClass:
        "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",

      valueClass: "text-blue-700 dark:text-blue-400",

      badgeClass:
        "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900",
    },

    {
      id: "shipping-import",

      title: "Average Shipping Time (Import)",

      category: "Import",

      value: data?.avgShippingImportDays ?? null,

      count: data?.shippingImportCount ?? 0,

      unit: "shipment records",

      description: "Rata-rata waktu pengiriman produk impor.",

      icon: Ship,

      iconClass:
        "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",

      valueClass: "text-blue-700 dark:text-blue-400",

      badgeClass:
        "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900",
    },

    {
      id: "production-domestic",

      title: "Average Production Time (Domestic)",

      category: "Domestic",

      value: data?.avgProductionDomesticDays ?? null,

      count: data?.productionDomesticCount ?? 0,

      unit: "production records",

      description: "Rata-rata waktu produksi vendor Indonesia.",

      icon: Factory,

      iconClass:
        "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",

      valueClass: "text-emerald-700 dark:text-emerald-400",

      badgeClass:
        "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900",
    },

    {
      id: "shipping-domestic",

      title: "Average Shipping Time (Domestic)",

      category: "Domestic",

      value: data?.avgShippingDomesticDays ?? null,

      count: data?.shippingDomesticCount ?? 0,

      unit: "shipment records",

      description: "Rata-rata waktu pengiriman produk domestik.",

      icon: Truck,

      iconClass:
        "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",

      valueClass: "text-emerald-700 dark:text-emerald-400",

      badgeClass:
        "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900",
    },
  ];

  const unknownProduction = data?.unclassifiedProductionCount ?? 0;

  const unknownShipping = data?.unclassifiedShippingCount ?? 0;

  const hasUnclassified = unknownProduction > 0 || unknownShipping > 0;

  return (
    <section className="mt-4 space-y-4">
      {/* SECTION HEADER */}
      <div>
        <h3 className="text-base font-semibold tracking-tight">
          Production & Shipping Performance
        </h3>

        <p className="mt-1 text-xs text-muted-foreground">
          Average duration by import and domestic category.
        </p>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;

          const hasData =
            typeof metric.value === "number" && Number.isFinite(metric.value);

          return (
            <Card
              key={metric.id}
              className="min-w-0 gap-3 border shadow-sm transition-shadow hover:shadow-md">
              <CardHeader className="space-y-3 pb-0">
                {/* CATEGORY & ICON */}
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${metric.badgeClass}`}>
                    {metric.category}
                  </span>

                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${metric.iconClass}`}>
                    <Icon className="h-[18px] w-[18px]" />
                  </div>
                </div>

                {/* TITLE */}
                <CardTitle className="min-h-10 text-sm font-medium leading-5 text-muted-foreground">
                  {metric.title}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* MAIN VALUE */}
                <div className="flex items-baseline gap-1.5">
                  <span
                    className={`text-3xl font-bold tracking-tight tabular-nums ${metric.valueClass}`}>
                    {hasData ? metric.value!.toFixed(1) : "—"}
                  </span>

                  <span className="text-sm font-medium text-muted-foreground">
                    days
                  </span>
                </div>

                {/* DESCRIPTION */}
                <p className="min-h-8 text-xs leading-relaxed text-muted-foreground">
                  {metric.description}
                </p>

                {/* RECORD COUNT */}
                <div className="border-t pt-3">
                  <p className="text-[11px] text-muted-foreground">
                    {hasData ? (
                      <>
                        Based on{" "}
                        <span className="font-semibold text-foreground">
                          {metric.count.toLocaleString("en-US")}
                        </span>{" "}
                        {metric.unit}
                      </>
                    ) : (
                      "No completed data available"
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* DATA QUALITY INFORMATION */}
      {hasUnclassified && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />

          <div className="space-y-1">
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
              Unclassified Logistics Data
            </p>

            <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-200">
              {unknownProduction} production records dan {unknownShipping}{" "}
              shipment records belum dapat dikategorikan sebagai Import atau
              Domestic. Data tersebut tidak disertakan dalam perhitungan
              rata-rata per kategori.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
