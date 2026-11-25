"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  CheckCircle2,
  Clock,
  FileText,
  FlaskConical,
  Info,
  Send,
  ShoppingBag,
  TrendingUp,
  XCircle,
  type LucideIcon,
} from "lucide-react";

export interface QuotationMetricsData {
  totalQuotation: number;

  draft: number;
  sent: number;
  accepted: number;
  rejected: number;

  followUp: number;
  expired: number;
  cancelled: number;

  totalSampleOrders: number;
  totalSalesOrders: number;

  convertedToSample: number;
  convertedToSales: number;

  avgSendingLeadTimeDays: number | null;
  avgAcceptedToSampleDays: number | null;
  avgAcceptedToSalesDays: number | null;

  quotationToSampleRate: number | null;
  quotationToSalesRate: number | null;

  uniqueSampleConversionRate: number | null;
  uniqueSalesConversionRate: number | null;

  sendingLeadTimeCount: number;
  sampleLeadTimeCount: number;
  salesLeadTimeCount: number;
}

interface MetricCardProps {
  title: string;
  value: number | null | undefined;

  description: string;

  icon: LucideIcon;

  color: string;
  iconBackground: string;

  unit?: string;
  decimals?: number;

  footer?: string;
}

const formatNumber = (value: number, decimals = 0) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);

// ==========================================
// REUSABLE METRIC CARD
// ==========================================
function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  color,
  iconBackground,
  unit,
  decimals = 0,
  footer,
}: MetricCardProps) {
  const hasValue = typeof value === "number" && Number.isFinite(value);

  return (
    <Card className="flex h-full min-w-0 flex-col gap-3 border shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="space-y-3 pb-0">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBackground}`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>

        <CardTitle className="min-h-10 text-sm font-medium leading-5 text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-baseline gap-1.5">
          <span
            className={`text-3xl font-bold tracking-tight tabular-nums ${color}`}>
            {hasValue ? formatNumber(value, decimals) : "—"}
          </span>

          {unit && (
            <span className="text-sm font-medium text-muted-foreground">
              {unit}
            </span>
          )}
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>

        {footer && (
          <div className="mt-auto border-t pt-3">
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              {footer}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ==========================================
// MAIN QUOTATION METRICS
// ==========================================
export default function QuotationMetrics({
  data,
}: {
  data?: QuotationMetricsData;
}) {
  const statusMetrics: MetricCardProps[] = [
    {
      title: "Draft",
      value: data?.draft ?? 0,
      description: "Total Quotation berstatus Draft.",
      icon: FileText,
      color: "text-slate-700 dark:text-slate-300",
      iconBackground: "bg-slate-100 dark:bg-slate-800",
    },
    {
      title: "Sent",
      value: data?.sent ?? 0,
      description: "Total Quotation berstatus Sent.",
      icon: Send,
      color: "text-blue-600 dark:text-blue-400",
      iconBackground: "bg-blue-50 dark:bg-blue-950/50",
    },
    {
      title: "Accept",
      value: data?.accepted ?? 0,
      description: "Total Quotation berstatus Accepted.",
      icon: CheckCircle2,
      color: "text-emerald-600 dark:text-emerald-400",
      iconBackground: "bg-emerald-50 dark:bg-emerald-950/50",
    },
    {
      title: "Reject",
      value: data?.rejected ?? 0,
      description: "Total Quotation berstatus Rejected.",
      icon: XCircle,
      color: "text-rose-600 dark:text-rose-400",
      iconBackground: "bg-rose-50 dark:bg-rose-950/50",
    },
  ];

  const leadTimeMetrics: MetricCardProps[] = [
    {
      title: "Average Sending Quotation Lead Time",

      value: data?.avgSendingLeadTimeDays,

      description: "Rata-rata waktu yang dibutuhkan dari Draft ke Sent.",

      icon: Clock,

      color: "text-blue-600 dark:text-blue-400",

      iconBackground: "bg-blue-50 dark:bg-blue-950/50",

      unit: "days",
      decimals: 1,

      footer: `Based on ${data?.sendingLeadTimeCount ?? 0} valid quotations`,
    },
    {
      title: "Average ACC Quotation to Sample Order Lead Time",

      value: data?.avgAcceptedToSampleDays,

      description:
        "Rata-rata waktu dari Accepted hingga Sample Order pertama dibuat.",

      icon: FlaskConical,

      color: "text-violet-600 dark:text-violet-400",

      iconBackground: "bg-violet-50 dark:bg-violet-950/50",

      unit: "days",
      decimals: 1,

      footer: `Based on ${data?.sampleLeadTimeCount ?? 0} valid quotations`,
    },
    {
      title: "Average ACC Quotation to Sales Order Lead Time",

      value: data?.avgAcceptedToSalesDays,

      description:
        "Rata-rata waktu dari Accepted hingga Sales Order pertama dibuat.",

      icon: ShoppingBag,

      color: "text-emerald-600 dark:text-emerald-400",

      iconBackground: "bg-emerald-50 dark:bg-emerald-950/50",

      unit: "days",
      decimals: 1,

      footer: `Based on ${data?.salesLeadTimeCount ?? 0} valid quotations`,
    },
  ];

  const conversionMetrics: MetricCardProps[] = [
    {
      title: "Quotation Convert to Sample Rate",

      value: data?.quotationToSampleRate,

      description:
        "Total Sample Order yang berasal dari Quotation dibagi Total Quotation × 100%.",

      icon: TrendingUp,

      color: "text-violet-600 dark:text-violet-400",

      iconBackground: "bg-violet-50 dark:bg-violet-950/50",

      unit: "%",
      decimals: 1,

      footer: `${data?.totalSampleOrders ?? 0} sample orders from ${
        data?.convertedToSample ?? 0
      } unique quotations`,
    },
    {
      title: "Quotation Convert to Sales Rate",

      value: data?.quotationToSalesRate,

      description:
        "Total Sales Order yang berasal dari Quotation dibagi Total Quotation × 100%.",

      icon: TrendingUp,

      color: "text-emerald-600 dark:text-emerald-400",

      iconBackground: "bg-emerald-50 dark:bg-emerald-950/50",

      unit: "%",
      decimals: 1,

      footer: `${data?.totalSalesOrders ?? 0} sales orders from ${
        data?.convertedToSales ?? 0
      } unique quotations`,
    },
  ];

  const formatRate = (value?: number | null) =>
    typeof value === "number" && Number.isFinite(value)
      ? `${value.toFixed(1)}%`
      : "—";

  return (
    <div className="space-y-6">
      {/* ======================================
          QUOTATION STATUS
      ====================================== */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Quotation Status</h2>

            <p className="mt-1 text-xs text-muted-foreground">
              Distribusi status Quotation saat ini.
            </p>
          </div>

          <div className="rounded-lg border bg-muted/30 px-4 py-2">
            <span className="mr-2 text-xs text-muted-foreground">
              Total Quotation
            </span>

            <span className="text-sm font-bold tabular-nums">
              {formatNumber(data?.totalQuotation ?? 0)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statusMetrics.map((metric) => (
            <MetricCard key={metric.title} {...metric} />
          ))}
        </div>

        {/* OTHER STATUSES */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-lg border bg-muted/20 p-3 text-xs text-muted-foreground">
          <span>
            Follow Up:{" "}
            <strong className="text-foreground">
              {formatNumber(data?.followUp ?? 0)}
            </strong>
          </span>

          <span>
            Expired:{" "}
            <strong className="text-foreground">
              {formatNumber(data?.expired ?? 0)}
            </strong>
          </span>

          <span>
            Cancelled:{" "}
            <strong className="text-foreground">
              {formatNumber(data?.cancelled ?? 0)}
            </strong>
          </span>
        </div>
      </section>

      {/* ======================================
          LEAD TIME & CONVERSION
      ====================================== */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">
            Quotation Lead Time & Conversion
          </h2>

          <p className="mt-1 text-xs text-muted-foreground">
            Kecepatan proses penawaran dan performa konversi menjadi Order.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {[...leadTimeMetrics, ...conversionMetrics].map((metric) => (
            <MetricCard key={metric.title} {...metric} />
          ))}
        </div>
      </section>

      {/* ======================================
          UNIQUE CONVERSION RATE
      ====================================== */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">
              Unique Quotation to Sample Conversion
            </p>

            <p className="mt-2 text-xl font-bold text-violet-600">
              {formatRate(data?.uniqueSampleConversionRate)}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              {data?.convertedToSample ?? 0} dari {data?.totalQuotation ?? 0}{" "}
              quotation menghasilkan Sample Order.
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">
              Unique Quotation to Sales Conversion
            </p>

            <p className="mt-2 text-xl font-bold text-emerald-600">
              {formatRate(data?.uniqueSalesConversionRate)}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              {data?.convertedToSales ?? 0} dari {data?.totalQuotation ?? 0}{" "}
              quotation menghasilkan Sales Order.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ======================================
          DATA QUALITY INFORMATION
      ====================================== */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />

        <div className="space-y-1">
          <p className="text-xs font-semibold text-blue-800 dark:text-blue-300">
            Analytics Information
          </p>

          <p className="text-xs leading-relaxed text-blue-700 dark:text-blue-200">
            Lead time hanya dihitung dari Quotation yang memiliki timestamp
            perubahan status valid. Conversion dihitung berdasarkan Order yang
            memiliki referensi Quotation. Order CANCELLED tidak disertakan.
          </p>

          <p className="text-xs leading-relaxed text-blue-700 dark:text-blue-200">
            Filter menentukan periode pembuatan Quotation. Status dan hasil
            konversi menampilkan kondisi terbaru dari Quotation pada periode
            tersebut.
          </p>
        </div>
      </div>
    </div>
  );
}
